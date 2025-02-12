import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requiredFilesTable, stylesTable, styleSettingsTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { assert, generateId, MAX_FILE_SIZE, validateForm } from '$lib';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { uploadFile } from '$lib/server/s3';
import { findAllSettings } from '$lib/server/tex';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	const id = params.id as string;
	const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, id)).limit(1);

	if (!style) {
		return error(404, { message: 'Style not found' });
	}

	if (style.authorId && style.authorId !== locals.user.id) {
		return error(403, { message: 'You do not have permission to view this style' });
	}

	const files = await db.select().from(requiredFilesTable).where(eq(requiredFilesTable.stylesId, id));

	const settings = await db.select().from(styleSettingsTable).where(eq(styleSettingsTable.styleId, id));

	return { style, files, settings };
};

export const actions = {
	addFile: validateForm(
		z.object({
			name: z.string().min(3),
			description: z.string().min(3),
			path: z.string().min(3),
			file: z.instanceof(File).refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 25MB.`),
			override: z
				.string()
				.optional()
				.transform((v) => v === 'on')
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const styleId = params.id;
			assert(styleId);

			const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, styleId)).limit(1);

			if (!style || style.authorId !== locals.user.id) {
				error(404, { message: 'Style not found' });
			}

			const id = generateId();
			await uploadFile(id, form.file);
			await db.insert(requiredFilesTable).values({
				id,
				name: form.name,
				description: form.description,
				path: form.path,
				stylesId: styleId,
				mimeType: form.file.type,
				default: id,
				override: form.override ? 1 : 0
			});
		}
	),
	deleteFile: validateForm(
		z.object({
			id: z.string()
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const styleId = params.id;
			assert(styleId);

			const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, styleId)).limit(1);

			if (!style || style.authorId !== locals.user.id) {
				error(404, { message: 'Style not found' });
			}

			await db.delete(requiredFilesTable).where(eq(requiredFilesTable.id, form.id));
		}
	),
	'update-setting': validateForm(
		z.object({
			id: z.string(),
			value: z.string().optional(),
			comment: z.string().optional()
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const styleId = params.id;
			assert(styleId);

			const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, styleId)).limit(1);

			if (!style || style.authorId !== locals.user.id) {
				error(404, { message: 'Style not found' });
			}

			await db
				.update(styleSettingsTable)
				.set({
					value: form.value,
					comment: form.comment
				})
				.where(eq(styleSettingsTable.id, form.id));
		}
	),
	'update-main': validateForm(
		z.object({
			file: z.instanceof(File)
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const id = params.id;
			assert(id);

			const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, id)).limit(1);

			if (!style || style.authorId !== locals.user.id) {
				error(404, { message: 'Style not found' });
			}

			const content = await form.file.text();
			const settings = await findAllSettings(content);

			await uploadFile(id, form.file);
			await db.update(stylesTable).set({ mainFile: id }).where(eq(stylesTable.id, id));

			await db.delete(styleSettingsTable).where(eq(styleSettingsTable.styleId, id));
			for (const [setting, comment] of settings) {
				if (setting === undefined || comment === undefined) {
					continue;
				}

				await db.insert(styleSettingsTable).values({ id: generateId(), styleId: id, key: setting, value: '', comment });
			}
		}
	),
	delete: async ({ locals, params }) => {
		if (!locals.user) {
			return redirect(302, '/login');
		}

		const id = params.id;
		assert(id);

		await db.delete(stylesTable).where(eq(stylesTable.id, id));
		redirect(302, '/styles');
	}
};
