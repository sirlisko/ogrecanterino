import type { SceneData } from '@ogre/shared'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())

export const users = sqliteTable('users', {
  id: id(),
  discordId: text('discord_id').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['admin', 'gm'] })
    .notNull()
    .default('gm'),
  createdAt: createdAt(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
})

export const sounds = sqliteTable(
  'sounds',
  {
    id: id(),
    title: text('title').notNull(),
    artist: text('artist').notNull().default(''),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    filename: text('filename').notNull().unique(),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    durationMs: integer('duration_ms'),
    category: text('category', { enum: ['music', 'ambience', 'effect'] }).notNull(),
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('sounds_category_idx').on(t.category)],
)

export const scenes = sqliteTable(
  'scenes',
  {
    id: id(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    bannerPath: text('banner_path'),
    visibility: text('visibility', { enum: ['private', 'group'] })
      .notNull()
      .default('private'),
    combatSceneId: text('combat_scene_id'),
    data: text('data', { mode: 'json' }).$type<SceneData>().notNull(),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index('scenes_owner_idx').on(t.ownerId)],
)

export const favourites = sqliteTable(
  'favourites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    soundId: text('sound_id')
      .notNull()
      .references(() => sounds.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.soundId] })],
)

export const pads = sqliteTable(
  'pads',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slot: integer('slot').notNull(),
    soundId: text('sound_id')
      .notNull()
      .references(() => sounds.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.slot] })],
)

export const plays = sqliteTable(
  'plays',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    soundId: text('sound_id')
      .notNull()
      .references(() => sounds.id, { onDelete: 'cascade' }),
    playedAt: integer('played_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.soundId] })],
)
