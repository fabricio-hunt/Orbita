import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

// Usuários autenticados
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow()
});

// Conversas salvas
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  messages: jsonb('messages').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Log de uso da SimilarWeb
export const apiCalls = pgTable('api_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  toolName: text('tool_name').notNull(),
  domain: text('domain').notNull(),
  cached: boolean('cached').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Logs de Auditoria do Sistema
export const systemLogs = pgTable('system_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // Relacionamento opcional com usuários
  event: text('event').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});

// Instância do banco de dados conectada ao Neon
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
