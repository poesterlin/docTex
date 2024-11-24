import { date, integer, pgTable, text, time, timestamp } from 'drizzle-orm/pg-core';

const fullCascade = { onDelete: 'cascade', onUpdate: 'cascade' } as const;

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull(),
	email: text('email').notNull().unique()
});

export type User = typeof userTable.$inferSelect;

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, fullCascade),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
	sessionToken: text('session_token').notNull()
});

export type Session = typeof sessionTable.$inferSelect;

export const stylesTable = pgTable('styles', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	mainFile: text('main_file').notNull()
});

export type Style = typeof stylesTable.$inferSelect;

export const styleSettingsTable = pgTable('style_settings', {
	id: text('id').primaryKey(),
	styleId: text('style_id').references(() => stylesTable.id, fullCascade),
	key: text('key').notNull(),
	value: text('value').notNull(),
	comment: text('comment').notNull()
});

export const projectSettingsTable = pgTable('project_settings', {
	id: text('id').primaryKey(),
	setting: text('setting')
		.notNull()
		.references(() => styleSettingsTable.id, fullCascade),
	projectId: text('project_id').references(() => projectTable.id, fullCascade),
	value: text('value').notNull()
});

export const requiredFilesTable = pgTable('required_files', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	path: text('path').notNull(),
	stylesId: text('styles_id').references(() => stylesTable.id, fullCascade),
	mimeType: text('mime_type').notNull(),
	default: text('default').notNull(),
	override: integer('override').notNull()
});

export type RequiredFile = typeof requiredFilesTable.$inferSelect;

export const projectTable = pgTable('project', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, fullCascade),
	folderId: text('folder_id').notNull(),
	styleId: text('style_id')
		.notNull()
		.references(() => stylesTable.id, fullCascade)
});

export type Project = typeof projectTable.$inferSelect;

export const outputTable = pgTable('output', {
	id: text('id').primaryKey(),
	timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
	projectId: text('project_id')
		.notNull()
		.references(() => projectTable.id, fullCascade),
	logs: text('logs').notNull(),
	errors: text('errors').notNull()
});
