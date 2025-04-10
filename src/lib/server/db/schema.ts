import { boolean, integer, json, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

const fullCascade = { onDelete: 'cascade', onUpdate: 'cascade' } as const;

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull(),
	email: text('email').notNull().unique(),
	hasGoogleAuth: boolean('has_google_auth').notNull().default(true)
});

export type User = typeof userTable.$inferSelect;

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, fullCascade),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
	sessionToken: text('session_token').notNull(),
	isGoogleAuth: boolean('is_google_auth').notNull().default(false)
});

export type Session = typeof sessionTable.$inferSelect;

export const stylesTable = pgTable('styles', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	mainFile: text('main_file').notNull(),
	description: text('description').notNull(),
	authorId: text('author_id').references(() => userTable.id, { onDelete: 'set null' })
});

export type Style = typeof stylesTable.$inferSelect;

export const styleSettingsTable = pgTable('style_settings', {
	id: text('id').primaryKey(),
	styleId: text('style_id').references(() => stylesTable.id, fullCascade),
	key: text('key').notNull(),
	value: text('value').notNull(),
	comment: text('comment').notNull(),
	isBoolean: boolean('is_boolean').notNull().default(false)
});

export const projectSettingsTable = pgTable('project_settings', {
	id: text('id').primaryKey(),
	setting: text('setting')
		.notNull()
		.references(() => styleSettingsTable.id, fullCascade),
	projectId: text('project_id')
		.notNull()
		.references(() => projectTable.id, fullCascade),
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

export const projectFilesTable = pgTable('project_files', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => projectTable.id, fullCascade),
	fileId: text('file_id')
		.notNull()
		.references(() => requiredFilesTable.id, fullCascade)
});

export type RequiredFile = typeof requiredFilesTable.$inferSelect;

export const projectTable = pgTable('project', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, fullCascade),
	folderId: text('folder_id').notNull(),
	driveFolderId: text('drive_folder_id'),
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
	errors: text('errors').notNull(),
	running: boolean('running').notNull().default(false),
	fileId: text('file_id'),
	thumbnail: text('thumbnail'),
	wordCount: integer('word_count').notNull().default(0),
	duration: integer('duration').default(0)
});

export type Output = typeof outputTable.$inferSelect;

export const shareTokenTable = pgTable('share_token', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => projectTable.id, fullCascade),
	token: text('token').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull()
});

export type ShareToken = typeof shareTokenTable.$inferSelect;

export const bibliographyTable = pgTable(
	'bibliography',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.notNull()
			.references(() => projectTable.id, fullCascade),
		key: text('key').notNull(),
		content: json('content').notNull(),
		url: text('url'),
		notes: text('notes'),
		fileId: text('file_id'),
		doi: text('doi')
	},
	// do not allow two bibliography entries with the same key in the same project
	(t) => [unique().on(t.projectId, t.key)]
);

export type BibReference = typeof bibliographyTable.$inferSelect;

export const aiFilesTable = pgTable('ai_files', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => projectTable.id, fullCascade),
	fileId: text('file_id').notNull(),
	uri: text('uri').notNull(),
	mimeType: text('mime_type').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
});

export type AiFile = typeof aiFilesTable.$inferSelect;