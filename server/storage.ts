import { 
  User, InsertUser,
  MenuCategory, InsertMenuCategory,
  MenuItem, InsertMenuItem,
  Table, InsertTable,
  Reservation, InsertReservation,
  Payment, InsertPayment,
  Order, InsertOrder,
  users, menuCategories, menuItems, tables, reservations, payments, orders
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, like } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Menu Categories
  getMenuCategory(id: number): Promise<MenuCategory | undefined>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: number, categoryData: Partial<MenuCategory>): Promise<MenuCategory | undefined>;
  deleteMenuCategory(id: number): Promise<boolean>;
  getAllMenuCategories(): Promise<MenuCategory[]>;
  
  // Menu Items
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, itemData: Partial<MenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  getAllMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getFeaturedMenuItems(): Promise<MenuItem[]>;
  
  // Tables
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, tableData: Partial<Table>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;
  getAllTables(): Promise<Table[]>;
  getAvailableTables(date: Date, partySize: number): Promise<Table[]>;
  
  // Reservations
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, reservationData: Partial<Reservation>): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  getAllReservations(): Promise<Reservation[]>;
  getUserReservations(userId: number): Promise<Reservation[]>;
  getReservationsByDate(date: Date): Promise<Reservation[]>;
  getReservationsByStatus(status: string): Promise<Reservation[]>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  getReservationPayments(reservationId: number): Promise<Payment[]>;
  
  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getReservationOrders(reservationId: number): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private menuCategories: Map<number, MenuCategory>;
  private menuItems: Map<number, MenuItem>;
  private tables: Map<number, Table>;
  private reservations: Map<number, Reservation>;
  private payments: Map<number, Payment>;
  private orders: Map<number, Order>;
  
  private userCurrentId: number;
  private menuCategoryCurrentId: number;
  private menuItemCurrentId: number;
  private tableCurrentId: number;
  private reservationCurrentId: number;
  private paymentCurrentId: number;
  private orderCurrentId: number;

  constructor() {
    this.users = new Map();
    this.menuCategories = new Map();
    this.menuItems = new Map();
    this.tables = new Map();
    this.reservations = new Map();
    this.payments = new Map();
    this.orders = new Map();
    
    this.userCurrentId = 1;
    this.menuCategoryCurrentId = 1;
    this.menuItemCurrentId = 1;
    this.tableCurrentId = 1;
    this.reservationCurrentId = 1;
    this.paymentCurrentId = 1;
    this.orderCurrentId = 1;
    
    this.initializeData();
  }

  private initializeData() {
    // Add admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@opaquedelicia.pt",
      firstName: "Admin",
      lastName: "User",
      phone: "+351912345678",
      role: "admin",
      preferences: { language: "pt" }
    });
    
    // Add some menu categories
    const entradas = this.createMenuCategory({ name: "Entradas", description: "Appetizers and starters" });
    const pratosPrincipais = this.createMenuCategory({ name: "Pratos Principais", description: "Main dishes" });
    const sobremesas = this.createMenuCategory({ name: "Sobremesas", description: "Desserts" });
    const bebidas = this.createMenuCategory({ name: "Bebidas", description: "Drinks" });
    
    // Add some menu items
    this.createMenuItem({
      categoryId: entradas.id,
      name: "Coxinha de Frango",
      description: "Tradicional salgado brasileiro recheado com frango desfiado",
      price: 350, // €3.50
      imageUrl: "",
      featured: true
    });
    
    this.createMenuItem({
      categoryId: entradas.id,
      name: "Pastéis (3 unidades)",
      description: "Pastéis fritos crocantes com recheio à escolha",
      price: 500, // €5.00
      imageUrl: "",
      featured: true
    });
    
    this.createMenuItem({
      categoryId: pratosPrincipais.id,
      name: "Feijoada Completa",
      description: "Tradicional prato brasileiro com feijão preto, carnes variadas e acompanhamentos",
      price: 1850, // €18.50
      imageUrl: "",
      featured: true
    });
    
    this.createMenuItem({
      categoryId: pratosPrincipais.id,
      name: "Picanha Grelhada",
      description: "Corte nobre brasileiro grelhado no ponto, acompanhado de farofa e vinagrete",
      price: 2200, // €22.00
      imageUrl: "",
      featured: true
    });
    
    // Add some tables
    this.createTable({ number: 1, capacity: 2, category: "standard", available: true });
    this.createTable({ number: 2, capacity: 4, category: "standard", available: true });
    this.createTable({ number: 3, capacity: 6, category: "standard", available: true });
    this.createTable({ number: 4, capacity: 8, category: "vip", available: true });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Menu Category methods
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    return this.menuCategories.get(id);
  }

  async createMenuCategory(categoryData: InsertMenuCategory): Promise<MenuCategory> {
    const id = this.menuCategoryCurrentId++;
    const category: MenuCategory = { ...categoryData, id };
    this.menuCategories.set(id, category);
    return category;
  }

  async updateMenuCategory(id: number, categoryData: Partial<MenuCategory>): Promise<MenuCategory | undefined> {
    const existingCategory = this.menuCategories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...categoryData };
    this.menuCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    return this.menuCategories.delete(id);
  }

  async getAllMenuCategories(): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values());
  }

  // Menu Item methods
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(itemData: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemCurrentId++;
    const item: MenuItem = { ...itemData, id };
    this.menuItems.set(id, item);
    return item;
  }

  async updateMenuItem(id: number, itemData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const existingItem = this.menuItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...itemData };
    this.menuItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => item.categoryId === categoryId);
  }

  async getFeaturedMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => item.featured);
  }

  // Table methods
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async createTable(tableData: InsertTable): Promise<Table> {
    const id = this.tableCurrentId++;
    const table: Table = { ...tableData, id };
    this.tables.set(id, table);
    return table;
  }

  async updateTable(id: number, tableData: Partial<Table>): Promise<Table | undefined> {
    const existingTable = this.tables.get(id);
    if (!existingTable) return undefined;
    
    const updatedTable = { ...existingTable, ...tableData };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    return this.tables.delete(id);
  }

  async getAllTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async getAvailableTables(date: Date, partySize: number): Promise<Table[]> {
    // Get all tables with enough capacity
    const suitableTables = Array.from(this.tables.values()).filter(
      table => table.available && table.capacity >= partySize
    );
    
    // Get reservations for the given date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const reservationsOnDate = Array.from(this.reservations.values()).filter(
      res => new Date(res.date) >= dateStart && new Date(res.date) <= dateEnd && res.status !== "cancelled"
    );
    
    // Get IDs of tables that are already reserved
    const reservedTableIds = reservationsOnDate.map(res => res.tableId);
    
    // Filter out reserved tables
    return suitableTables.filter(table => !reservedTableIds.includes(table.id));
  }

  // Reservation methods
  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    const id = this.reservationCurrentId++;
    const reservation: Reservation = { ...reservationData, id };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async updateReservation(id: number, reservationData: Partial<Reservation>): Promise<Reservation | undefined> {
    const existingReservation = this.reservations.get(id);
    if (!existingReservation) return undefined;
    
    const updatedReservation = { ...existingReservation, ...reservationData };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<boolean> {
    return this.reservations.delete(id);
  }

  async getAllReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getUserReservations(userId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      reservation => reservation.userId === userId
    );
  }

  async getReservationsByDate(date: Date): Promise<Reservation[]> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    return Array.from(this.reservations.values()).filter(
      res => new Date(res.date) >= dateStart && new Date(res.date) <= dateEnd
    );
  }

  async getReservationsByStatus(status: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      reservation => reservation.status === status
    );
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const payment: Payment = { ...paymentData, id };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const existingPayment = this.payments.get(id);
    if (!existingPayment) return undefined;
    
    const updatedPayment = { ...existingPayment, ...paymentData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getReservationPayments(reservationId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.reservationId === reservationId
    );
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const order: Order = { ...orderData, id };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder = { ...existingOrder, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getReservationOrders(reservationId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.reservationId === reservationId
    );
  }
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Menu Categories
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    const [category] = await db.select().from(menuCategories).where(eq(menuCategories.id, id));
    return category || undefined;
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db
      .insert(menuCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateMenuCategory(id: number, categoryData: Partial<MenuCategory>): Promise<MenuCategory | undefined> {
    const [updatedCategory] = await db
      .update(menuCategories)
      .set(categoryData)
      .where(eq(menuCategories.id, id))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(menuCategories)
      .where(eq(menuCategories.id, id));
    return result.rowCount > 0;
  }

  async getAllMenuCategories(): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories);
  }

  // Menu Items
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item || undefined;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db
      .insert(menuItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateMenuItem(id: number, itemData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const [updatedItem] = await db
      .update(menuItems)
      .set(itemData)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id));
    return result.rowCount > 0;
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId));
  }

  async getFeaturedMenuItems(): Promise<MenuItem[]> {
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.featured, true));
  }

  // Tables
  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table || undefined;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db
      .insert(tables)
      .values(table)
      .returning();
    return newTable;
  }

  async updateTable(id: number, tableData: Partial<Table>): Promise<Table | undefined> {
    const [updatedTable] = await db
      .update(tables)
      .set(tableData)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable || undefined;
  }

  async deleteTable(id: number): Promise<boolean> {
    const result = await db
      .delete(tables)
      .where(eq(tables.id, id));
    return result.rowCount > 0;
  }

  async getAllTables(): Promise<Table[]> {
    return await db.select().from(tables);
  }

  async getAvailableTables(date: Date, partySize: number): Promise<Table[]> {
    // Get all tables with enough capacity
    const allTables = await db
      .select()
      .from(tables)
      .where(
        and(
          eq(tables.available, true),
          gte(tables.capacity, partySize)
        )
      );
    
    // Get reservations for the given date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const reservationsOnDate = await db
      .select()
      .from(reservations)
      .where(
        and(
          gte(reservations.date, dateStart),
          lte(reservations.date, dateEnd),
          sql`${reservations.status} != 'cancelled'`
        )
      );
    
    // Get IDs of tables that are already reserved
    const reservedTableIds = reservationsOnDate.map(res => res.tableId);
    
    // Filter out reserved tables
    return allTables.filter(table => !reservedTableIds.includes(table.id));
  }

  // Reservations
  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db
      .insert(reservations)
      .values(reservation)
      .returning();
    return newReservation;
  }

  async updateReservation(id: number, reservationData: Partial<Reservation>): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set(reservationData)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation || undefined;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const result = await db
      .delete(reservations)
      .where(eq(reservations.id, id));
    return result.rowCount > 0;
  }

  async getAllReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getUserReservations(userId: number): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.userId, userId));
  }

  async getReservationsByDate(date: Date): Promise<Reservation[]> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(reservations)
      .where(
        and(
          gte(reservations.date, dateStart),
          lte(reservations.date, dateEnd)
        )
      );
  }

  async getReservationsByStatus(status: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.status, status));
  }

  // Payments
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set(paymentData)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getReservationPayments(reservationId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.reservationId, reservationId));
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(orderData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getReservationOrders(reservationId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.reservationId, reservationId));
  }
}

// Initialize the database storage
export const storage = new DatabaseStorage();
