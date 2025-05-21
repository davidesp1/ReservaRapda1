import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const reservationStatusEnum = pgEnum('reservation_status', ['pending', 'confirmed', 'cancelled', 'completed', 'no-show']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'mbway', 'multibanco', 'bankTransfer', 'cash']);
export const tableCategoryEnum = pgEnum('table_category', ['standard', 'vip', 'outdoor', 'private']);
export const dietaryPreferenceEnum = pgEnum('dietary_preference', ['vegetarian', 'vegan', 'gluten-free', 'lactose-free', 'pescatarian', 'halal', 'kosher', 'none']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  birthDate: timestamp("birth_date"),
  profilePicture: text("profile_picture"),
  biography: text("biography"),
  role: userRoleEnum("role").notNull().default("customer"),
  preferences: json("preferences").$type<{
    language: string,
    dietaryRestrictions?: string[],
    favoriteItems?: number[],
    allergies?: string[],
    spicePreference?: 'mild' | 'medium' | 'hot',
    preferredSeating?: 'indoor' | 'outdoor' | 'no-preference',
    preferredDiningTimes?: string[],
    theme?: 'light' | 'dark' | 'system',
    notifications?: {
      email?: boolean,
      sms?: boolean,
      promotions?: boolean,
      reservationReminders?: boolean
    }
  }>(),
  memberSince: timestamp("member_since").defaultNow(),
  lastLogin: timestamp("last_login"),
  status: text("status").default("active"),
  loyaltyPoints: integer("loyalty_points").default(0),
});

// The relations will be defined after all the tables are created

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Menu
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description")
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({
  id: true,
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

// Tables
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  category: tableCategoryEnum("category").default("standard"),
  available: boolean("available").default(true),
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
});

// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tableId: integer("table_id").notNull(),
  date: timestamp("date").notNull(),
  partySize: integer("party_size").notNull(),
  status: reservationStatusEnum("status").default("pending"),
  notes: text("notes"),
  specialRequests: text("special_requests"),
  duration: integer("duration").default(120), // Duration in minutes, default 2 hours
  confirmationCode: text("confirmation_code"),
  confirmationDate: timestamp("confirmation_date"),
  reminderSent: boolean("reminder_sent").default(false),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  dietaryRequirements: text("dietary_requirements"),
  occasion: text("occasion"), // Aniversário, aniversário de casamento, etc.
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  reservationId: integer("reservation_id"),
  amount: integer("amount").notNull(), // Amount in cents
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").default("pending"),
  reference: text("reference"),
  transactionId: text("transaction_id"),
  paymentDate: timestamp("payment_date"),
  details: json("details").$type<{
    entity?: string;
    reference?: string;
    status?: string;
    mbwayAlias?: string;
    paymentUrl?: string;
    iban?: string;
    bankName?: string;
    expirationDate?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
});

// Dietary Preferences
export const userDietaryPreferences = pgTable("user_dietary_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  preference: dietaryPreferenceEnum("preference").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserDietaryPreferenceSchema = createInsertSchema(userDietaryPreferences).omit({
  id: true,
  createdAt: true,
});

// Orders (for future implementation)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").default("pending"),
  items: json("items").$type<Array<{
    menuItemId: number,
    quantity: number,
    price: number,
    notes?: string,
    modifications?: string[]
  }>>(),
  totalAmount: integer("total_amount").notNull(), // Amount in cents
  specialInstructions: text("special_instructions"),
  orderTime: timestamp("order_time").defaultNow(),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  rating: integer("rating"), // Customer rating (1-5)
  feedback: text("feedback"), // Customer feedback
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
});

// Types export
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type UserDietaryPreference = typeof userDietaryPreferences.$inferSelect;
export type InsertUserDietaryPreference = z.infer<typeof insertUserDietaryPreferenceSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
  dietaryPreferences: many(userDietaryPreferences),
  orders: many(orders),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  table: one(tables, {
    fields: [reservations.tableId],
    references: [tables.id],
  }),
  payments: many(payments),
  orders: many(orders),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  reservation: one(reservations, {
    fields: [payments.reservationId],
    references: [reservations.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  reservation: one(reservations, {
    fields: [orders.reservationId],
    references: [reservations.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const userDietaryPreferencesRelations = relations(userDietaryPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userDietaryPreferences.userId],
    references: [users.id],
  }),
}));

// Settings table for the system
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'general', 'reservations', 'payments', 'notifications'
  key: text("key").notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Settings table
export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  eupagoApiKey: text("eupago_api_key").notNull(),
  enableCard: boolean("enable_card").default(true),
  enableMbway: boolean("enable_mbway").default(true),
  enableMultibanco: boolean("enable_multibanco").default(true),
  enableBankTransfer: boolean("enable_bank_transfer").default(true),
  enableCash: boolean("enable_cash").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Database Settings table
export const databaseSettings = pgTable("database_settings", {
  id: serial("id").primaryKey(),
  supabaseUrl: text("supabase_url").notNull(),
  supabaseKey: text("supabase_key").notNull(),
  databaseUrl: text("database_url").notNull(),
  databaseHost: text("database_host").notNull(),
  databasePort: text("database_port").notNull(),
  databaseName: text("database_name").notNull(),
  databaseUser: text("database_user").notNull(),
  databasePassword: text("database_password").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  updatedAt: true,
});

export const updatePaymentSettingsSchema = z.object({
  eupagoApiKey: z.string().min(1, { message: "API Key é obrigatória" }),
  enabledPaymentMethods: z.object({
    card: z.boolean().default(true),
    mbway: z.boolean().default(true),
    multibanco: z.boolean().default(true),
    bankTransfer: z.boolean().default(true),
    cash: z.boolean().default(true),
  }),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;
export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type InsertPaymentSetting = z.infer<typeof insertPaymentSettingsSchema>;
