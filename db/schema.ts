import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core'

// The single Player who owns this System. The first email to complete sign-in claims ownership
// (unless OWNER_EMAIL is configured, in which case only that address may ever sign in).
export const owner = pgTable('owner', {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  playerName: text('player_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// One-time sign-in codes delivered by email. Only the SHA-256 hash is stored.
export const authCodes = pgTable('auth_codes', {
  id: serial().primaryKey(),
  email: text().notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer().default(0).notNull(),
  consumed: boolean().default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Long-lived device sessions. Only the SHA-256 hash of the cookie token is stored.
export const sessions = pgTable('sessions', {
  id: serial().primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  email: text().notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
})

// The complete Player save file (one row). Stored as a versioned JSON document so
// every device sees the same progression. Version is bumped on each write for conflict detection.
export const playerState = pgTable('player_state', {
  id: integer().primaryKey(),
  data: jsonb().notNull(),
  version: integer().default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Append-only progression log used for history and analytics across devices.
export const events = pgTable('events', {
  id: serial().primaryKey(),
  kind: text().notNull(),
  title: text().notNull(),
  xp: integer().default(0).notNull(),
  gold: integer().default(0).notNull(),
  payload: jsonb(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
