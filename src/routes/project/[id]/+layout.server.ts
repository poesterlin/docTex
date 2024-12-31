import { db } from '$lib/server/db';
import { projectTable, type Project } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	let project: Project | null = null;

	// If user is not logged in, check if they are invited to a project
	if (locals.invite) {
		const [result] = await db.select().from(projectTable).where(eq(projectTable.id, locals.invite.projectId)).limit(1);
		project = result;
	} else if (locals.user) {
		const id = params.id;
		const [result] = await db
			.select()
			.from(projectTable)
			.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
			.limit(1);

		project = result;
	} else {
		redirect(302, '/login');
	}

	if (!project) {
		error(404, 'Project not found');
	}

	return { project, isShared: !!locals.invite };
};
