import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { bibliographyTable, projectTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { assert, generateId, validateForm } from '$lib';
import { z } from 'zod';

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
			content: z.string()
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

			const match = form.content.match(/@\w+\{(?<key>[\w-]+),/);
			const key = match?.groups?.key;

			if (!match || !key) {
				error(400, { message: 'Invalid citation format' });
			}

			await db.insert(bibliographyTable).values({
				id: generateId(),
				projectId: id,
				key: key,
				content: form.content
			});

			return { redirect: `/project/${id}/bib` };
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
	)
};
