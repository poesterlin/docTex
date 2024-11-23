import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull(),
	email: text('email').notNull().unique()
});

export type User = typeof userTable.$inferSelect;

export const sessionTable = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	sessionToken: text('session_token').notNull()
});

export type Session = typeof sessionTable.$inferSelect;

export const stylesTable = sqliteTable('styles', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	mainFile: text('main_file').notNull(),
});

export type Style = typeof stylesTable.$inferSelect;

export const styleSettingsTable = sqliteTable('style_settings', {
	id: text('id').primaryKey(),
	styleId: text('style_id').references(() => stylesTable.id),
	key: text('key').notNull(),
	value: text('value').notNull()
});

export const projectSettingsTable = sqliteTable('project_settings', {
	id: text('id').primaryKey(),
	projectId: text('project_id').references(() => projectTable.id),
	key: text('key').notNull(),
	value: text('value').notNull()
});

export const requiredFilesTable = sqliteTable('required_files', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	path: text('path').notNull(),
	stylesId: text('styles_id').references(() => stylesTable.id),
	mimeType: text('mime_type').notNull(),
	default: text('default').notNull(),
	override: integer('override').notNull()
});

export type RequiredFile = typeof requiredFilesTable.$inferSelect;

export const projectTable = sqliteTable('project', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	folderId: text('folder_id').notNull(),
	styleId: text('style_id')
		.notNull()
		.references(() => stylesTable.id)
});

export type Project = typeof projectTable.$inferSelect;
