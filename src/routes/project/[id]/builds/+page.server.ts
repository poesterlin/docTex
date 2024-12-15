import { db } from '$lib/server/db';
import { outputTable, projectTable } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const load = async ({ locals, params, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project } = await parent();

	if (!project) {
		error(404, 'Project not found');
	}

	const { id } = project;

	const outputs = await db.select().from(outputTable).where(eq(outputTable.projectId, id)).orderBy(desc(outputTable.timestamp));

	return { project, outputs };
};

export const actions: Actions = {
	cancel: async ({ locals, params }) => {
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

		const [lastBuild] = await db
			.select()
			.from(outputTable)
			.where(and(eq(outputTable.projectId, id), eq(outputTable.running, true)))
			.orderBy(desc(outputTable.timestamp))
			.limit(1);

		if (!lastBuild || !lastBuild.running) {
			error(400, { message: 'No build running' });
		}

		await db.update(outputTable).set({ running: false }).where(eq(outputTable.id, lastBuild.id));
	}
};
