import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Para conexão direta com PostgreSQL no Supabase
const connectionString = process.env.DATABASE_URL;
// Para queries SQL usando postgres-js
const queryClient = postgres(connectionString, { ssl: 'require' });
// Para o Drizzle ORM
export const db = drizzle(queryClient);

// Expor o cliente Supabase para funcionalidades adicionais quando necessário
export const supabase = createClient(
  'https://wtykoitqlndqyglpogux.supabase.co',
  process.env.SUPABASE_KEY || '' // Isso é um placeholder, idealmente deveria ser configurado
);
