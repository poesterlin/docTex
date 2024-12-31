import { db } from '$lib/server/db';
import { outputTable, projectTable, shareTokenTable } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { generateId, validateForm } from '$lib';
import { generateSessionToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project } = await parent();

	if (!project) {
		error(404, 'Project not found');
	}

	const { id } = project;

	const invites = await db.select().from(shareTokenTable).where(eq(shareTokenTable.projectId, id)).orderBy(desc(shareTokenTable.createdAt));

	return { project, invites };
};

export const actions: Actions = {
	cancel: validateForm(
		z.object({
			id: z.string()
		}),
		async ({ params, locals }, form) => {
			if (!locals.user || !locals.session) {
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

			const [shareToken] = await db
				.select()
				.from(shareTokenTable)
				.where(and(eq(shareTokenTable.projectId, id), eq(shareTokenTable.id, form.id)))
				.limit(1);

			if (!shareToken) {
				error(404, { message: 'No share token found' });
			}

			await db.delete(shareTokenTable).where(eq(shareTokenTable.id, shareToken.id));
		}
	),
	invite: async ({ locals, params }) => {
		if (!locals.user || !locals.session) {
			return redirect(302, '/login');
		}

		const projectId = params.id;
		if (!projectId) {
			error(400, { message: 'Invalid project ID' });
		}

		const [project] = await db
			.select()
			.from(projectTable)
			.where(and(eq(projectTable.id, projectId), eq(projectTable.userId, locals.user.id)))
			.limit(1);

		if (!project) {
			error(404, { message: 'Project not found' });
		}

		const token = generateSessionToken();
		await db.insert(shareTokenTable).values({
			token,
			projectId,
			id: generateId(),
			createdAt: new Date()
		});

		return { token };
	}
};
