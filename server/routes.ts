import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { processPayment, checkPaymentStatus } from "./services/paymentService";
import { 
  insertUserSchema, 
  insertMenuCategorySchema, 
  insertMenuItemSchema, 
  insertTableSchema, 
  insertReservationSchema, 
  insertPaymentSchema,
  insertOrderSchema,
  settings
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Setup session store
const MemorySessionStore = MemoryStore(session);

// Função auxiliar para verificar disponibilidade de mesa
async function checkTableAvailability(tableId: number, date: Date, timeSlot: string, duration: number = 2): Promise<boolean> {
  // Obter todas as reservas
  const allReservations = await storage.getAllReservations();
  
  // Filtrar reservas para esta mesa e data
  const reservationsForTable = allReservations.filter(r => {
    // Verificar se é para a mesma mesa
    if (r.tableId !== tableId) return false;
    
    // Verificar se é para o mesmo dia
    const rDate = new Date(r.date);
    const targetDate = new Date(date);
    if (rDate.getFullYear() !== targetDate.getFullYear() || 
        rDate.getMonth() !== targetDate.getMonth() || 
        rDate.getDate() !== targetDate.getDate()) {
      return false;
    }
    
    // Verificar se há sobreposição de horário
    const rTime = r.timeSlot;
    const [rHours, rMinutes] = rTime.split(':').map(Number);
    const [targetHours, targetMinutes] = timeSlot.split(':').map(Number);
    
    const rStartTime = rHours * 60 + rMinutes;
    const rEndTime = rStartTime + (r.duration || 2) * 60;
    const targetStartTime = targetHours * 60 + targetMinutes;
    const targetEndTime = targetStartTime + duration * 60;
    
    // Há sobreposição se o início ou fim de uma reserva está dentro da outra
    return (targetStartTime < rEndTime && targetEndTime > rStartTime);
  });
  
  return reservationsForTable.length > 0;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: "opaqueDelicia2025",
      resave: false,
      saveUninitialized: false,
      store: new MemorySessionStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
    })
  );

  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  const isAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Add user info to session for future use
    req.session.user = user;
    next();
  };

  // Error handler middleware
  const handleErrors = (fn: Function) => async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error("Error handling request:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors
        });
      }

      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  };

  // Authentication routes
  app.post("/api/auth/register", handleErrors(async (req: Request, res: Response) => {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if email is already registered
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    // Create the user
    const user = await storage.createUser(userData);
    
    // Set userId in session
    req.session.userId = user.id;
    
    return res.status(201).json({ message: "User created successfully", userId: user.id });
  }));
  
  app.post("/api/auth/login", handleErrors(async (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    
    if ((!email && !username) || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }
    
    let user: any = null;
    
    // Verificar login com email
    if (email) {
      user = await storage.getUserByEmail(email);
    }
    
    // Verificar login com username
    if (!user && username) {
      user = await storage.getUserByUsername(username);
    }
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Set userId in session
    req.session.userId = user.id;
    
    return res.json({ 
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  }));
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", handleErrors(async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Failed to destroy session:", err);
        }
      });
      return res.status(401).json({ message: "User not found" });
    }
    
    return res.json({ 
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  }));

  // Menu category routes
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
    
    return res.json(category);
  }));
  
  app.post("/api/menu-categories", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const categoryData = insertMenuCategorySchema.parse(req.body);
    const newCategory = await storage.createMenuCategory(categoryData);
    res.status(201).json(newCategory);
  }));
  
  app.put("/api/menu-categories/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const categoryData = insertMenuCategorySchema.parse(req.body);
    
    // Check if category exists
    const category = await storage.getMenuCategory(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const updatedCategory = await storage.updateMenuCategory(id, categoryData);
    res.json(updatedCategory);
  }));
  
  app.delete("/api/menu-categories/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Check if category exists
    const category = await storage.getMenuCategory(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Check if category has menu items
    const menuItems = await storage.getMenuItemsByCategory(id);
    if (menuItems.length > 0) {
      return res.status(400).json({ message: "Cannot delete category with menu items" });
    }
    
    await storage.deleteMenuCategory(id);
    res.json({ message: "Category deleted successfully" });
  }));

  // Menu item routes
  app.get("/api/menu-items", handleErrors(async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const menuItems = categoryId 
      ? await storage.getMenuItemsByCategory(categoryId)
      : await storage.getAllMenuItems();
    res.json(menuItems);
  }));
  
  app.get("/api/menu-items/:id", handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const menuItem = await storage.getMenuItem(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    return res.json(menuItem);
  }));
  
  app.post("/api/menu-items", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const menuItemData = insertMenuItemSchema.parse(req.body);
    
    // Check if category exists
    const category = await storage.getMenuCategory(menuItemData.categoryId);
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    
    const newMenuItem = await storage.createMenuItem(menuItemData);
    res.status(201).json(newMenuItem);
  }));
  
  app.put("/api/menu-items/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const menuItemData = insertMenuItemSchema.parse(req.body);
    
    // Check if menu item exists
    const menuItem = await storage.getMenuItem(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    // Check if category exists
    const category = await storage.getMenuCategory(menuItemData.categoryId);
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    
    const updatedMenuItem = await storage.updateMenuItem(id, menuItemData);
    res.json(updatedMenuItem);
  }));
  
  app.delete("/api/menu-items/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Check if menu item exists
    const menuItem = await storage.getMenuItem(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    await storage.deleteMenuItem(id);
    res.json({ message: "Menu item deleted successfully" });
  }));

  // Table routes
  app.get("/api/tables", handleErrors(async (req: Request, res: Response) => {
    const tables = await storage.getAllTables();
    res.json(tables);
  }));
  
  app.get("/api/tables/available", handleErrors(async (req: Request, res: Response) => {
    const { date, time, duration } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ message: "Date and time are required" });
    }
    
    const dateTime = new Date(`${date}T${time}`);
    const durationHours = duration ? parseInt(duration as string) : 2; // Default 2 hours
    
    const availableTables = await storage.getAvailableTables(dateTime, durationHours);
    res.json(availableTables);
  }));
  
  app.get("/api/tables/:id", handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const table = await storage.getTable(id);
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    return res.json(table);
  }));
  
  app.post("/api/tables", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const tableData = insertTableSchema.parse(req.body);
    const newTable = await storage.createTable(tableData);
    res.status(201).json(newTable);
  }));
  
  app.put("/api/tables/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const tableData = insertTableSchema.parse(req.body);
    
    // Check if table exists
    const table = await storage.getTable(id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    const updatedTable = await storage.updateTable(id, tableData);
    res.json(updatedTable);
  }));
  
  app.delete("/api/tables/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Check if table exists
    const table = await storage.getTable(id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    // Check if table has reservations
    const allReservations = await storage.getAllReservations();
    const reservations = allReservations.filter(r => r.tableId === id);
    if (reservations.length > 0) {
      return res.status(400).json({ message: "Cannot delete table with reservations" });
    }
    
    await storage.deleteTable(id);
    res.json({ message: "Table deleted successfully" });
  }));

  // Reservation routes
  app.get("/api/reservations", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    
    // If admin, return all reservations or filtered by date
    const user = await storage.getUser(userId);
    if (user?.role === "admin") {
      const date = req.query.date as string;
      const reservations = date 
        ? await storage.getReservationsByDate(new Date(date))
        : await storage.getAllReservations();
      return res.json(reservations);
    }
    
    // Otherwise, return only user's reservations
    const reservations = await storage.getUserReservations(userId);
    res.json(reservations);
  }));
  
  app.get("/api/reservations/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    const reservation = await storage.getReservation(id);
    
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    // Check permission: admin can see all, regular users only their own
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this reservation" });
    }
    
    return res.json(reservation);
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
    
    // Check if the table is already booked for the requested time
    const isTableBooked = await checkTableAvailability(
      reservationData.tableId,
      new Date(reservationData.date),
      reservationData.timeSlot,
      reservationData.duration || 2
    );
    
    if (isTableBooked) {
      return res.status(400).json({ message: "Table already booked for this time" });
    }
    
    const newReservation = await storage.createReservation(reservationData);
    res.status(201).json(newReservation);
  }));
  
  app.put("/api/reservations/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    // Verify reservation exists and belongs to user or user is admin
    const reservation = await storage.getReservation(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this reservation" });
    }
    
    // If changing table or date, verify availability
    if (req.body.tableId !== undefined && req.body.tableId !== reservation.tableId) {
      const table = await storage.getTable(req.body.tableId);
      if (!table || !table.available) {
        return res.status(400).json({ message: "Table not available" });
      }
      
      const isTableBooked = await storage.isTableBooked(
        req.body.tableId,
        req.body.date ? new Date(req.body.date) : new Date(reservation.date),
        req.body.duration || reservation.duration,
        id // Exclude current reservation from check
      );
      
      if (isTableBooked) {
        return res.status(400).json({ message: "Table already booked for this time" });
      }
    }
    
    // Update the reservation
    const updatedReservation = await storage.updateReservation(id, req.body);
    res.json(updatedReservation);
  }));
  
  app.delete("/api/reservations/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    // Verify reservation exists and belongs to user or user is admin
    const reservation = await storage.getReservation(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    const user = await storage.getUser(userId);
    if (reservation.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this reservation" });
    }
    
    await storage.deleteReservation(id);
    res.json({ message: "Reservation deleted successfully" });
  }));

  // Payment routes
  app.get("/api/payments", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const payments = await storage.getAllPayments();
    res.json(payments);
  }));
  
  // Processa um novo pagamento usando a API Eupago
  app.post("/api/payments/process", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const { method, amount, reference, description, email, name, phone } = req.body;
    const userId = req.session.userId!;
    
    if (!method || amount === undefined || !reference) {
      return res.status(400).json({ message: "Informações de pagamento incompletas" });
    }
    
    const paymentResult = await processPayment({
      method,
      amount: Number(amount),
      reference,
      description: description || `Reserva ${reference}`,
      email: email || undefined,
      name: name || undefined,
      phone
    });
    
    // Verificar se o processamento de pagamento foi bem-sucedido
    if (!paymentResult.success) {
      return res.status(400).json({ 
        message: paymentResult.message || "Falha no processamento do pagamento" 
      });
    }
    
    // Cria registro de pagamento no banco de dados
    try {
      await storage.createPayment({
        userId,
        amount: Number(amount),
        method,
        status: "pending",
        reference: paymentResult.paymentReference,
        details: {
          entity: paymentResult.entity,
          reference: paymentResult.reference,
          status: paymentResult.status,
          paymentUrl: paymentResult.paymentUrl,
          expirationDate: paymentResult.expirationDate
        }
      });
    } catch (error) {
      console.error("Falha ao salvar registro de pagamento:", error);
      // Continua mesmo assim, já que o pagamento foi processado
    }
    
    return res.status(200).json(paymentResult);
  }));
  
  // Verifica o status de um pagamento
  app.get("/api/payments/status/:reference", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({ message: "Referência de pagamento é obrigatória" });
    }
    
    const statusResult = await checkPaymentStatus(reference);
    return res.json(statusResult);
  }));
  
  app.get("/api/payments/:id", isAuthenticated, handleErrors(async (req: Request, res: Response) => {
    const paymentId = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    // Adicionar verificação para saber se o paymentId é um número válido
    if (isNaN(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID format" });
    }
    
    const payment = await storage.getPayment(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Only users should access their own payments or admin can access all
    if (payment.userId !== userId && !req.session.user?.isAdmin) {
      return res.status(403).json({ message: "You don't have permission to view this payment" });
    }
    
    return res.json(payment);
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
    
    // Get total amount from the request or calculate from reservation
    const amount = req.body.amount || 0;
    const method = req.body.method;
    
    if (!method || !['card', 'mbway', 'multibanco', 'transfer'].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    
    // Generate a unique reference for this payment
    const reference = `RES${reservationId}-${Date.now()}`;
    const description = `Payment for Reservation #${reservationId} at Opa Que Delicia`;
    
    // Process payment with our payment service
    const paymentResult = await processPayment({
      method,
      amount: Number(amount),
      reference,
      description,
      email: req.body.email,
      name: req.body.name,
      phone: req.body.phone
    });
    
    // Verificar se o processamento de pagamento foi bem-sucedido
    if (!paymentResult.success) {
      return res.status(400).json({ 
        message: paymentResult.message || "Falha no processamento do pagamento" 
      });
    }
    
    // Criar registro de pagamento no banco de dados
    try {
      const payment = await storage.createPayment({
        userId,
        reservationId,
        amount: Number(amount),
        method,
        status: "pending",
        reference: paymentResult.paymentReference,
        details: {
          entity: paymentResult.entity,
          reference: paymentResult.reference,
          status: paymentResult.status,
          paymentUrl: paymentResult.paymentUrl,
          expirationDate: paymentResult.expirationDate,
          mbwayAlias: method === 'mbway' ? req.body.phone : undefined
        }
      });
      
      return res.status(200).json({
        success: true,
        payment,
        paymentDetails: paymentResult
      });
    } catch (error) {
      console.error("Falha ao salvar registro de pagamento:", error);
      
      // Retorna os detalhes do pagamento mesmo que falhe ao salvar no banco
      return res.status(200).json({
        success: true,
        payment: null,
        paymentDetails: paymentResult,
        warning: "O pagamento foi processado, mas houve uma falha ao registrá-lo no sistema."
      });
    }
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
    
    const orders = await storage.getOrdersByReservationId(reservationId);
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
    
    // Create order data
    const orderData = insertOrderSchema.parse({
      ...req.body,
      userId,
      reservationId
    });
    
    const newOrder = await storage.createOrder(orderData);
    res.status(201).json(newOrder);
  }));

  // User routes (admin only)
  app.get("/api/users", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.json(users);
  }));

  app.get("/api/users/:id", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.json(user);
  }));

  // Stats for dashboard
  app.get("/api/stats/dashboard", isAdmin, handleErrors(async (req: Request, res: Response) => {
    // Get stats for dashboard
    const totalUsers = await storage.countTotalUsers();
    const totalReservations = await storage.countTotalReservations();
    const upcomingReservations = await storage.countUpcomingReservations();
    const totalRevenue = await storage.calculateTotalRevenue();
    
    res.json({
      totalUsers,
      totalReservations,
      upcomingReservations,
      totalRevenue
    });
  }));

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Settings routes
  app.get("/api/settings", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const allSettings = await storage.getAllSettings();
    res.json(allSettings);
  }));

  app.get("/api/settings/:category", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const { category } = req.params;
    const settings = await storage.getSettingsByCategory(category);
    res.json(settings);
  }));

  app.put("/api/settings/:category", isAdmin, handleErrors(async (req: Request, res: Response) => {
    const { category } = req.params;
    const settingsData = req.body;
    
    await storage.updateSettings(category, settingsData);
    
    res.json({ success: true, message: `${category} settings updated successfully` });
  }));

  const httpServer = createServer(app);
  
  return httpServer;
}