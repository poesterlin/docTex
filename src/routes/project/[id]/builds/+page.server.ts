import { db } from '$lib/server/db';
import { outputTable } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
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

	const outputs = await db
		.select()
		.from(outputTable)
		.where(eq(outputTable.projectId, id))
		.orderBy(desc(outputTable.timestamp));

	return { project, outputs };
};

export const actions: Actions = {};
