import { 
  User, InsertUser,
  MenuCategory, InsertMenuCategory,
  MenuItem, InsertMenuItem,
  Table, InsertTable,
  Reservation, InsertReservation,
  Payment, InsertPayment,
  Order, InsertOrder,
  Setting, InsertSetting,
  PaymentSetting, InsertPaymentSetting,
  DatabaseSetting, InsertDatabaseSetting,
  users, menuCategories, menuItems, tables, reservations, payments, orders, settings, paymentSettings, databaseSettings
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
  
  // Settings
  getSettingsByCategory(category: string): Promise<Record<string, string>>;
  getAllSettings(): Promise<Record<string, Record<string, string>>>;
  updateSettings(category: string, settingsData: Record<string, string>): Promise<boolean>;
  
  // Payment Settings
  getPaymentSettings(): Promise<PaymentSetting | undefined>;
  updatePaymentSettings(data: Partial<InsertPaymentSetting>): Promise<PaymentSetting>;
  
  // Database Settings
  getDatabaseSettings(): Promise<DatabaseSetting | undefined>;
  updateDatabaseSettings(data: Partial<InsertDatabaseSetting>): Promise<DatabaseSetting>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private menuCategories: Map<number, MenuCategory> = new Map();
  private menuItems: Map<number, MenuItem> = new Map();
  private tables: Map<number, Table> = new Map();
  private reservations: Map<number, Reservation> = new Map();
  private payments: Map<number, Payment> = new Map();
  private orders: Map<number, Order> = new Map();
  private settings: Map<string, Map<string, string>> = new Map();
  private paymentSettings: PaymentSetting | undefined;
  private databaseSettings: DatabaseSetting | undefined;
  
  private userCurrentId: number = 1;
  private menuCategoryCurrentId: number = 1;
  private menuItemCurrentId: number = 1;
  private tableCurrentId: number = 1;
  private reservationCurrentId: number = 1;
  private paymentCurrentId: number = 1;
  private orderCurrentId: number = 1;

  constructor() {
    this.initializeData();
    this.initializeSettings();
    this.initializePaymentSettings();
    this.initializeDatabaseSettings();
  }

  // Users
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
    const user: User = { 
      ...userData, 
      id,
      phone: userData.phone || null,
      address: userData.address || null,
      city: userData.city || null,
      postalCode: userData.postalCode || null,
      country: userData.country || null,
      birthDate: userData.birthDate || null,
      profilePicture: userData.profilePicture || null,
      biography: userData.biography || null,
      loyaltyPoints: userData.loyaltyPoints || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Menu Categories
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    return this.menuCategories.get(id);
  }

  async createMenuCategory(categoryData: InsertMenuCategory): Promise<MenuCategory> {
    const id = this.menuCategoryCurrentId++;
    const category: MenuCategory = { 
      ...categoryData, 
      id,
      description: categoryData.description || null 
    };
    this.menuCategories.set(id, category);
    return category;
  }

  async updateMenuCategory(id: number, categoryData: Partial<MenuCategory>): Promise<MenuCategory | undefined> {
    const category = this.menuCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.menuCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    return this.menuCategories.delete(id);
  }

  async getAllMenuCategories(): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values());
  }

  // Menu Items
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(itemData: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemCurrentId++;
    const item: MenuItem = { 
      ...itemData, 
      id,
      description: itemData.description || null,
      imageUrl: itemData.imageUrl || null,
      featured: itemData.featured || null 
    };
    this.menuItems.set(id, item);
    return item;
  }

  async updateMenuItem(id: number, itemData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const item = this.menuItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
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

  // Tables
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async createTable(tableData: InsertTable): Promise<Table> {
    const id = this.tableCurrentId++;
    const table: Table = { 
      ...tableData, 
      id,
      category: tableData.category || null,
      available: tableData.available === undefined ? true : tableData.available
    };
    this.tables.set(id, table);
    return table;
  }

  async updateTable(id: number, tableData: Partial<Table>): Promise<Table | undefined> {
    const table = this.tables.get(id);
    if (!table) return undefined;
    
    const updatedTable = { ...table, ...tableData };
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
    // In a real app, we'd check for reservations at the given date/time
    // For now, just return tables that are marked as available and can fit the party
    return Array.from(this.tables.values()).filter(table => 
      table.available && table.capacity >= partySize
    );
  }

  // Reservations
  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    const id = this.reservationCurrentId++;
    const reservation: Reservation = { 
      ...reservationData, 
      id,
      status: reservationData.status || "pending",
      notes: reservationData.notes || null,
      specialRequests: reservationData.specialRequests || null,
      duration: reservationData.duration || null,
      confirmationCode: reservationData.confirmationCode || null,
      confirmationSent: reservationData.confirmationSent || null,
      reminderSent: reservationData.reminderSent || null,
      cancellationReason: reservationData.cancellationReason || null,
      occasion: reservationData.occasion || null,
    };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async updateReservation(id: number, reservationData: Partial<Reservation>): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id);
    if (!reservation) return undefined;
    
    const updatedReservation = { ...reservation, ...reservationData };
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
    return Array.from(this.reservations.values()).filter(reservation => reservation.userId === userId);
  }

  async getReservationsByDate(date: Date): Promise<Reservation[]> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    return Array.from(this.reservations.values()).filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate >= dateStart && reservationDate <= dateEnd;
    });
  }

  async getReservationsByStatus(status: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(reservation => reservation.status === status);
  }

  // Payments
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const payment: Payment = { 
      ...paymentData, 
      id,
      status: paymentData.status || "pending",
      transactionId: paymentData.transactionId || null,
      paymentDate: paymentData.paymentDate || null,
      eupagoDetails: paymentData.eupagoDetails || null
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getReservationPayments(reservationId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.reservationId === reservationId);
  }

  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const order: Order = { 
      ...orderData, 
      id,
      status: orderData.status || null,
      items: orderData.items || null,
      discount: orderData.discount || null,
      tax: orderData.tax || null,
      notes: orderData.notes || null,
      paymentId: orderData.paymentId || null,
      completedAt: orderData.completedAt || null,
      createdAt: orderData.createdAt || null
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getReservationOrders(reservationId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.reservationId === reservationId);
  }
  
  // Settings management for MemStorage
  async getSettingsByCategory(category: string): Promise<Record<string, string>> {
    const categorySettings = this.settings.get(category);
    if (!categorySettings) {
      return {};
    }
    
    // Convert Map to regular object
    const result: Record<string, string> = {};
    categorySettings.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }
  
  async getAllSettings(): Promise<Record<string, Record<string, string>>> {
    const result: Record<string, Record<string, string>> = {};
    
    this.settings.forEach((categorySettings, category) => {
      result[category] = {};
      categorySettings.forEach((value, key) => {
        result[category][key] = value;
      });
    });
    
    return result;
  }
  
  async updateSettings(category: string, settingsData: Record<string, string>): Promise<boolean> {
    let categoryMap = this.settings.get(category);
    
    if (!categoryMap) {
      categoryMap = new Map<string, string>();
      this.settings.set(category, categoryMap);
    }
    
    // Update settings
    Object.entries(settingsData).forEach(([key, value]) => {
      categoryMap!.set(key, value);
    });
    
    return true;
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
  
  private initializeSettings() {
    // General settings
    const generalSettings = new Map<string, string>();
    generalSettings.set('restaurantName', 'Opa que delicia');
    generalSettings.set('address', 'MSBN Europe Convention Center, Barcelona');
    generalSettings.set('phone', '+34 612 345 678');
    generalSettings.set('email', 'contact@opaquedelicia.com');
    generalSettings.set('website', 'https://opaquedelicia.com');
    generalSettings.set('openingTime', '11:00');
    generalSettings.set('closingTime', '23:00');
    generalSettings.set('description', 'Autêntica comida brasileira durante a convenção MSBN Europe');
    this.settings.set('general', generalSettings);
    
    // Reservation settings
    const reservationSettings = new Map<string, string>();
    reservationSettings.set('minReservationTime', '60');
    reservationSettings.set('maxReservationTime', '180');
    reservationSettings.set('reservationTimeInterval', '30');
    reservationSettings.set('maxPartySize', '12');
    reservationSettings.set('reservationLeadHours', '2');
    reservationSettings.set('maxAdvanceReservationDays', '30');
    reservationSettings.set('allowCustomersToCancel', 'true');
    reservationSettings.set('requireConfirmation', 'true');
    reservationSettings.set('autoConfirmReservations', 'false');
    this.settings.set('reservations', reservationSettings);
    
    // Payment settings
    const paymentSettings = new Map<string, string>();
    paymentSettings.set('currency', 'EUR');
    paymentSettings.set('acceptCreditCards', 'true');
    paymentSettings.set('acceptDebitCards', 'true');
    paymentSettings.set('acceptCash', 'true');
    paymentSettings.set('acceptMBWay', 'true');
    paymentSettings.set('acceptMultibanco', 'true');
    paymentSettings.set('acceptBankTransfer', 'true');
    paymentSettings.set('requirePrepayment', 'false');
    paymentSettings.set('requirePrepaymentAmount', '0');
    paymentSettings.set('showPricesWithTax', 'true');
    paymentSettings.set('taxRate', '23');
    this.settings.set('payments', paymentSettings);
    
    // Notification settings
    const notificationSettings = new Map<string, string>();
    notificationSettings.set('sendEmailConfirmation', 'true');
    notificationSettings.set('sendSmsConfirmation', 'false');
    notificationSettings.set('sendEmailReminders', 'true');
    notificationSettings.set('sendSmsReminders', 'false');
    notificationSettings.set('reminderHoursBeforeReservation', '24');
    notificationSettings.set('allowCustomerFeedback', 'true');
    notificationSettings.set('collectCustomerFeedback', 'true');
    this.settings.set('notifications', notificationSettings);
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {}
  
  // Payment Settings
  async getPaymentSettings(): Promise<PaymentSetting | undefined> {
    try {
      const [settings] = await drizzle.select().from(schema.paymentSettings);
      return settings;
    } catch (error) {
      console.error("Erro ao buscar configurações de pagamento:", error);
      return undefined;
    }
  }
  
  async updatePaymentSettings(data: Partial<InsertPaymentSetting>): Promise<PaymentSetting> {
    try {
      const [settings] = await drizzle.select().from(schema.paymentSettings);
      
      if (settings) {
        // Atualizar configurações existentes
        const [updatedSettings] = await drizzle
          .update(schema.paymentSettings)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(schema.paymentSettings.id, settings.id))
          .returning();
        
        return updatedSettings;
      } else {
        // Criar novas configurações
        const [newSettings] = await drizzle
          .insert(schema.paymentSettings)
          .values({
            eupagoApiKey: data.eupagoApiKey || '',
            enableCard: data.enableCard !== undefined ? data.enableCard : true,
            enableMbway: data.enableMbway !== undefined ? data.enableMbway : true,
            enableMultibanco: data.enableMultibanco !== undefined ? data.enableMultibanco : true,
            enableBankTransfer: data.enableBankTransfer !== undefined ? data.enableBankTransfer : true,
            enableCash: data.enableCash !== undefined ? data.enableCash : true,
            updatedAt: new Date()
          })
          .returning();
        
        return newSettings;
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações de pagamento:", error);
      throw error;
    }
  }
  
  // Database Settings
  async getDatabaseSettings(): Promise<DatabaseSetting | undefined> {
    try {
      const [settings] = await drizzle.select().from(schema.databaseSettings);
      return settings;
    } catch (error) {
      console.error("Erro ao buscar configurações do banco de dados:", error);
      return undefined;
    }
  }
  
  async updateDatabaseSettings(data: Partial<InsertDatabaseSetting>): Promise<DatabaseSetting> {
    try {
      const [settings] = await drizzle.select().from(schema.databaseSettings);
      
      if (settings) {
        // Atualizar configurações existentes
        const [updatedSettings] = await drizzle
          .update(schema.databaseSettings)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(schema.databaseSettings.id, settings.id))
          .returning();
        
        return updatedSettings;
      } else {
        // Criar novas configurações
        const [newSettings] = await drizzle
          .insert(schema.databaseSettings)
          .values({
            supabaseUrl: data.supabaseUrl || '',
            supabaseKey: data.supabaseKey || '',
            databaseUrl: data.databaseUrl || '',
            databaseHost: data.databaseHost || '',
            databasePort: data.databasePort || '',
            databaseName: data.databaseName || '',
            databaseUser: data.databaseUser || '',
            databasePassword: data.databasePassword || '',
            updatedAt: new Date()
          })
          .returning();
        
        return newSettings;
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações do banco de dados:", error);
      throw error;
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
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
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Menu Categories
  async getMenuCategory(id: number): Promise<MenuCategory | undefined> {
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.id, id));
    return category;
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
    return updatedCategory;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(menuCategories)
      .where(eq(menuCategories.id, id));
    return result.count > 0;
  }

  async getAllMenuCategories(): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories);
  }

  // Menu Items
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));
    return item;
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
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id));
    return result.count > 0;
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
    const [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id));
    return table;
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
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    const result = await db
      .delete(tables)
      .where(eq(tables.id, id));
    return result.count > 0;
  }

  async getAllTables(): Promise<Table[]> {
    return await db.select().from(tables);
  }

  async getAvailableTables(date: Date, partySize: number): Promise<Table[]> {
    // Get all tables that can fit the party
    const availableTables = await db
      .select()
      .from(tables)
      .where(
        and(
          eq(tables.available, true),
          gte(tables.capacity, partySize)
        )
      );
    
    // In a real app, we'd also check for reservations at the given date/time
    // For now, just return tables that are marked as available and can fit the party
    return availableTables;
  }

  // Reservations
  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id));
    return reservation;
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
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const result = await db
      .delete(reservations)
      .where(eq(reservations.id, id));
    return result.count > 0;
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
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
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
    return updatedPayment;
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
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
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
    return updatedOrder;
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

  // Settings management
  async getSettingsByCategory(category: string): Promise<Record<string, string>> {
    const settingsData = await db
      .select()
      .from(settings)
      .where(eq(settings.category, category));
    
    const result: Record<string, string> = {};
    settingsData.forEach(setting => {
      if (setting.value !== null) {
        result[setting.key] = setting.value;
      }
    });
    
    return result;
  }
  
  async getAllSettings(): Promise<Record<string, Record<string, string>>> {
    const settingsData = await db
      .select()
      .from(settings);
    
    const result: Record<string, Record<string, string>> = {};
    
    settingsData.forEach(setting => {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }
      
      if (setting.value !== null) {
        result[setting.category][setting.key] = setting.value;
      }
    });
    
    return result;
  }
  
  async updateSettings(category: string, settingsData: Record<string, string>): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        // Process each setting
        for (const [key, value] of Object.entries(settingsData)) {
          const existingSetting = await tx
            .select()
            .from(settings)
            .where(and(
              eq(settings.category, category),
              eq(settings.key, key)
            ));
          
          if (existingSetting.length > 0) {
            // Update existing setting
            await tx
              .update(settings)
              .set({ value, updatedAt: new Date() })
              .where(and(
                eq(settings.category, category),
                eq(settings.key, key)
              ));
          } else {
            // Insert new setting
            await tx
              .insert(settings)
              .values({
                category,
                key,
                value,
                updatedAt: new Date()
              });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      return false;
    }
  }

  // Payment Settings management
  async getPaymentSettings(): Promise<PaymentSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(paymentSettings)
        .limit(1);
        
      return settings;
    } catch (error) {
      console.error("Erro ao buscar configurações de pagamento:", error);
      return undefined;
    }
  }
  
  async updatePaymentSettings(data: Partial<InsertPaymentSetting>): Promise<PaymentSetting> {
    try {
      // Verificar se já existe configuração
      const existingSettings = await this.getPaymentSettings();
      
      if (existingSettings) {
        // Atualizar configuração existente
        const [updatedSettings] = await db
          .update(paymentSettings)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(paymentSettings.id, existingSettings.id))
          .returning();
          
        return updatedSettings;
      } else {
        // Inserir nova configuração
        const [newSettings] = await db
          .insert(paymentSettings)
          .values({
            eupagoApiKey: data.eupagoApiKey || '',
            enableCard: data.enableCard !== undefined ? data.enableCard : true,
            enableMbway: data.enableMbway !== undefined ? data.enableMbway : true,
            enableMultibanco: data.enableMultibanco !== undefined ? data.enableMultibanco : true,
            enableBankTransfer: data.enableBankTransfer !== undefined ? data.enableBankTransfer : true,
            enableCash: data.enableCash !== undefined ? data.enableCash : true,
            updatedAt: new Date()
          })
          .returning();
          
        return newSettings;
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações de pagamento:", error);
      throw new Error("Falha ao atualizar configurações de pagamento");
    }
  }
}

// Initialize the database storage
export const storage = new DatabaseStorage();
