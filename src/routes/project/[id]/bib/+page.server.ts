import { generateId, validateForm } from '$lib';
import { db } from '$lib/server/db';
import { bibliographyTable, projectTable } from '$lib/server/db/schema';
import { uploadFile } from '$lib/server/s3';
import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { formatDoi, requestDoiInfo } from './doi';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project } = await parent();

	if (!project) {
		error(404, 'Project not found');
	}

	const { id } = project;

	const bibliography = await db.select().from(bibliographyTable).where(eq(bibliographyTable.projectId, id)).orderBy(bibliographyTable.key);

	return { project, bibliography };
};

export const actions: Actions = {
	addBib: validateForm(
		z.object({
			content: z.string(),
			url: z.string().optional(),
			notes: z.string().optional(),
			file: z.instanceof(File).optional(),
			doi: z.string().optional()
		}),
		async ({ params, locals }, form) => {
			if (!locals.user) {
				redirect(302, '/login');
			}

			const { id } = params;
			if (!id) {
				error(400, { message: 'Invalid project ID' });
			}

			const [project] = await db
				.select()
				.from(projectTable)
				.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
				.limit(1);

			if (!project) {
				error(404, { message: 'Project not found' });
			}

			// example of a valid citation
			// @type{key,
			//     title={...},
			//     author={...},
			//     journal={...},
			// }

			const regex = /@\w+\{(?<key>[\w-]+),/;
			const match = regex.exec(form.content);
			const key = match?.groups?.key;

			if (!match || !key) {
				error(400, { message: 'Invalid citation format' });
			}

			if (form.doi) {
				form.doi = formatDoi(form.doi);
			}

			let fileId = null;
			const file = form.file;
			if (file) {
				fileId = generateId();
				await uploadFile(fileId, file);
			}

			await db.insert(bibliographyTable).values({
				id: generateId(),
				projectId: id,
				key: key,
				content: form.content,
				url: form.url,
				notes: form.notes,
				fileId,
				doi: form.doi
			});

			return { redirect: `/project/${id}/bib` };
		}
	),
	import: validateForm(
		z.object({
			bib: z.instanceof(File)
		}),
		async ({ params, locals }, form) => {
			if (!locals.user) {
				redirect(302, '/login');
			}

			const { id } = params;
			if (!id) {
				error(400, { message: 'Invalid project ID' });
			}

			const [project] = await db
				.select()
				.from(projectTable)
				.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
				.limit(1);

			if (!project) {
				error(404, { message: 'Project not found' });
			}

			const text = await form.bib.text();
			const entries = text.split('@');

			const insert = entries.map((entry) => {
				entry = '@' + entry.trim();

				const match = entry.match(/@\w+\{(?<key>[\w-]+),/);
				const key = match?.groups?.key;

				if (!match || !key) {
					return null;
				}

				return {
					id: generateId(),
					projectId: id,
					key: key,
					content: entry
				};
			});

			const validEntries = insert.filter((entry) => entry !== null);

			await db.insert(bibliographyTable).values(validEntries);
		}
	),
	delBib: validateForm(
		z.object({
			id: z.string()
		}),
		async ({ params, locals }, form) => {
			if (!locals.user) {
				redirect(302, '/login');
			}

			const { id } = params;
			if (!id) {
				error(400, { message: 'Invalid project ID' });
			}

			const [project] = await db
				.select()
				.from(projectTable)
				.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
				.limit(1);

			if (!project) {
				error(404, { message: 'Project not found' });
			}

			await db.delete(bibliographyTable).where(and(eq(bibliographyTable.id, form.id), eq(bibliographyTable.projectId, id)));
		}
	),
	'update-note': validateForm(
		z.object({
			id: z.string(),
			notes: z.string()
		}),
		async ({ params, locals }, form) => {
			if (!locals.user) {
				redirect(302, '/login');
			}

			const { id } = params;
			if (!id) {
				error(400, { message: 'Invalid project ID' });
			}

			const [project] = await db
				.select()
				.from(projectTable)
				.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
				.limit(1);

			if (!project) {
				error(404, { message: 'Project not found' });
			}

			await db
				.update(bibliographyTable)
				.set({ notes: form.notes })
				.where(and(eq(bibliographyTable.id, form.id), eq(bibliographyTable.projectId, id)));
		}
	)
};
