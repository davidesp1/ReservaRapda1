import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, 
  insertMenuCategorySchema, 
  insertMenuItemSchema, 
  insertTableSchema, 
  insertReservationSchema, 
  insertPaymentSchema,
  insertOrderSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Setup session store
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours
      }),
      secret: process.env.SESSION_SECRET || "opa-que-delicia-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    })
  );

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user && user.role === "admin") {
        return next();
      }
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Error handler middleware
  const handleErrors = (fn: Function) => async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  };

  // Authentication routes
  app.post("/api/auth/register", handleErrors(async (req: Request, res: Response) => {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingByEmail = await storage.getUserByEmail(userData.email);
    if (existingByEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    const existingByUsername = await storage.getUserByUsername(userData.username);
    if (existingByUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }
    
    // Create new user
    const newUser = await storage.createUser(userData);
    
    // Omit password before sending response
    const { password, ...userWithoutPassword } = newUser;
    
    // Set session
    req.session.userId = newUser.id;
    
    res.status(201).json(userWithoutPassword);
  }));

  app.post("/api/auth/login", handleErrors(async (req: Request, res: Response) => {
    const loginSchema = z.object({
      username: z.string(),
      password: z.string()
    });
    
    const { username, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Set session
    req.session.userId = user.id;
    
    // Omit password before sending response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  }));

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", handleErrors(async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Omit password before sending response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  }));

  // Menu Category routes
  app.get("/api/menu-categories", handleErrors(async (req: Request, res: Response) => {
    const categories = await storage.getAllMenuCategories();
    res.json(categories);
  }));

  app.get("/api/menu-categories/:id", handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const category = await storage.getMenuCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  }));

  app.post("/api/menu-categories", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const categoryData = insertMenuCategorySchema.parse(req.body);
    const newCategory = await storage.createMenuCategory(categoryData);
    res.status(201).json(newCategory);
  }));

  app.put("/api/menu-categories/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const categoryData = insertMenuCategorySchema.parse(req.body);
    
    const updatedCategory = await storage.updateMenuCategory(id, categoryData);
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(updatedCategory);
  }));

  app.delete("/api/menu-categories/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteMenuCategory(id);
    
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json({ message: "Category deleted successfully" });
  }));

  // Menu Item routes
  app.get("/api/menu-items", handleErrors(async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const featured = req.query.featured === "true";
    
    let items;
    if (categoryId) {
      items = await storage.getMenuItemsByCategory(categoryId);
    } else if (featured) {
      items = await storage.getFeaturedMenuItems();
    } else {
      items = await storage.getAllMenuItems();
    }
    
    res.json(items);
  }));

  app.get("/api/menu-items/:id", handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const item = await storage.getMenuItem(id);
    
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json(item);
  }));

  app.post("/api/menu-items", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const itemData = insertMenuItemSchema.parse(req.body);
    const newItem = await storage.createMenuItem(itemData);
    res.status(201).json(newItem);
  }));

  app.put("/api/menu-items/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const itemData = insertMenuItemSchema.parse(req.body);
    
    const updatedItem = await storage.updateMenuItem(id, itemData);
    if (!updatedItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json(updatedItem);
  }));

  app.delete("/api/menu-items/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteMenuItem(id);
    
    if (!success) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json({ message: "Menu item deleted successfully" });
  }));

  // Table routes
  app.get("/api/tables", handleErrors(async (req: Request, res: Response) => {
    const tables = await storage.getAllTables();
    res.json(tables);
  }));

  app.get("/api/tables/available", handleErrors(async (req: Request, res: Response) => {
    const dateStr = req.query.date as string;
    const partySize = parseInt(req.query.partySize as string);
    
    if (!dateStr || isNaN(partySize)) {
      return res.status(400).json({ message: "Date and party size are required" });
    }
    
    const date = new Date(dateStr);
    const availableTables = await storage.getAvailableTables(date, partySize);
    
    res.json(availableTables);
  }));

  app.get("/api/tables/:id", handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const table = await storage.getTable(id);
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.json(table);
  }));

  app.post("/api/tables", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const tableData = insertTableSchema.parse(req.body);
    const newTable = await storage.createTable(tableData);
    res.status(201).json(newTable);
  }));

  app.put("/api/tables/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const tableData = insertTableSchema.parse(req.body);
    
    const updatedTable = await storage.updateTable(id, tableData);
    if (!updatedTable) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.json(updatedTable);
  }));

  app.delete("/api/tables/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteTable(id);
    
    if (!success) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.json({ message: "Table deleted successfully" });
  }));

  // Reservation routes
  app.get("/api/reservations", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    
    // If admin, return all reservations with optional filters
    if (user && user.role === "admin") {
      const dateStr = req.query.date as string;
      const status = req.query.status as string;
      
      if (dateStr) {
        const date = new Date(dateStr);
        const reservations = await storage.getReservationsByDate(date);
        return res.json(reservations);
      }
      
      if (status) {
        const reservations = await storage.getReservationsByStatus(status);
        return res.json(reservations);
      }
      
      const allReservations = await storage.getAllReservations();
      return res.json(allReservations);
    }
    
    // For regular users, return only their reservations
    const userReservations = await storage.getUserReservations(userId);
    res.json(userReservations);
  }));

  app.get("/api/reservations/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userId = req.session.userId!;
    const reservation = await storage.getReservation(id);
    
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(reservation);
  }));

  app.post("/api/reservations", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const reservationData = insertReservationSchema.parse({
      ...req.body,
      userId
    });
    
    // Check if the table is available
    const table = await storage.getTable(reservationData.tableId);
    if (!table || !table.available) {
      return res.status(400).json({ message: "Table not available" });
    }
    
    // Check if table capacity is sufficient
    if (table.capacity < reservationData.partySize) {
      return res.status(400).json({ message: "Table capacity insufficient for party size" });
    }
    
    // Check if the table is already reserved for that date
    const availableTables = await storage.getAvailableTables(new Date(reservationData.date), reservationData.partySize);
    const isTableAvailable = availableTables.some(t => t.id === reservationData.tableId);
    
    if (!isTableAvailable) {
      return res.status(400).json({ message: "Table already reserved for that date and time" });
    }
    
    const newReservation = await storage.createReservation(reservationData);
    res.status(201).json(newReservation);
  }));

  app.put("/api/reservations/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    // Check if reservation exists
    const existingReservation = await storage.getReservation(id);
    if (!existingReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (existingReservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // Parse and update reservation
    const reservationData = req.body;
    const updatedReservation = await storage.updateReservation(id, reservationData);
    
    res.json(updatedReservation);
  }));

  app.delete("/api/reservations/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    // Check if reservation exists
    const existingReservation = await storage.getReservation(id);
    if (!existingReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (existingReservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // For customers, update status to cancelled instead of deleting
    if (user?.role !== "admin") {
      const updatedReservation = await storage.updateReservation(id, { status: "cancelled" });
      return res.json({ message: "Reservation cancelled successfully" });
    }
    
    // Admins can actually delete
    const success = await storage.deleteReservation(id);
    res.json({ message: "Reservation deleted successfully" });
  }));

  // Payment routes
  app.get("/api/payments", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const payments = await storage.getAllPayments();
    res.json(payments);
  }));

  app.get("/api/reservations/:reservationId/payments", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const reservationId = parseInt(req.params.reservationId);
    const userId = req.session.userId!;
    
    // Check if reservation exists
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const payments = await storage.getReservationPayments(reservationId);
    res.json(payments);
  }));

  app.post("/api/reservations/:reservationId/payments", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const reservationId = parseInt(req.params.reservationId);
    const userId = req.session.userId!;
    
    // Check if reservation exists
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // Create payment
    const paymentData = insertPaymentSchema.parse({
      ...req.body,
      reservationId,
      paymentDate: new Date()
    });
    
    // TODO: In a real app, integrate with eupago.pt API here
    
    const newPayment = await storage.createPayment(paymentData);
    
    // Update reservation status if payment is completed
    if (paymentData.status === "completed") {
      await storage.updateReservation(reservationId, { status: "confirmed" });
    }
    
    res.status(201).json(newPayment);
  }));

  // Order routes
  app.get("/api/orders", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const orders = await storage.getAllOrders();
    res.json(orders);
  }));

  app.get("/api/reservations/:reservationId/orders", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const reservationId = parseInt(req.params.reservationId);
    const userId = req.session.userId!;
    
    // Check if reservation exists
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const orders = await storage.getReservationOrders(reservationId);
    res.json(orders);
  }));

  app.post("/api/reservations/:reservationId/orders", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const reservationId = parseInt(req.params.reservationId);
    const userId = req.session.userId!;
    
    // Check if reservation exists
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check if user is the owner of the reservation or an admin
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    // Create order
    const orderData = insertOrderSchema.parse({
      ...req.body,
      reservationId
    });
    
    const newOrder = await storage.createOrder(orderData);
    res.status(201).json(newOrder);
  }));

  // User routes (admin only)
  app.get("/api/users", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    // Omit passwords
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  }));

  app.get("/api/users/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Omit password
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  }));

  // Stats routes (admin only)
  app.get("/api/stats/dashboard", isAdmin, handleErrors(async (req: Request, res: Response) => {
    // Calculate today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get reservations for today
    const todayReservations = await storage.getReservationsByDate(today);
    
    // Get cancelled reservations
    const cancelledReservations = await storage.getReservationsByStatus("cancelled");
    
    // Get all users
    const users = await storage.getAllUsers();
    const customerCount = users.filter(user => user.role === "customer").length;
    
    // Get all payments
    const payments = await storage.getAllPayments();
    const todayPayments = payments.filter(payment => {
      if (!payment.paymentDate) return false;
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= today && payment.status === "completed";
    });
    
    // Calculate daily revenue
    const dailyRevenue = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get recent reservations (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const allReservations = await storage.getAllReservations();
    const recentReservations = allReservations.filter(res => {
      const resDate = new Date(res.date);
      return resDate >= lastWeek;
    });
    
    // Group reservations by day for the last 7 days
    const reservationsByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const count = recentReservations.filter(res => {
        const resDate = new Date(res.date);
        return resDate >= date && resDate < nextDay;
      }).length;
      
      return {
        date: date.toISOString().split('T')[0],
        count
      };
    }).reverse();
    
    // Get popular menu items based on orders
    const menuItems = await storage.getAllMenuItems();
    
    // Generate some sample data for popular items (this would normally come from real orders)
    const popularItems = menuItems.slice(0, 5).map(item => ({
      id: item.id,
      name: item.name,
      count: Math.floor(Math.random() * 20) + 1 // Random count between 1-20
    }));
    
    // Generate some sample data for daily revenue (this would normally come from real payments)
    const revenueByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      return {
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 1000 // Random amount between 1000-6000
      };
    }).reverse();
    
    // Return dashboard data
    res.json({
      todayReservations: todayReservations.length,
      cancelledReservations: cancelledReservations.length,
      customerCount,
      dailyRevenue,
      reservationsByDay,
      popularItems,
      revenueByDay,
      pendingPayments: payments.filter(p => p.status === "pending").length
    });
  }));

  // API health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
