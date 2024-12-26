import { db } from '$lib/server/db';
import { outputTable, projectTable } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { z } from 'zod';
import { validateForm } from '$lib';

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
	cancel: validateForm(
		z.object({
			buildId: z.string()
		}),
		async ({ params, locals }, form) => {
			if (!locals.user || !locals.session) {
				redirect(302, '/login');
			}

			const { id } = params;
			if (!id) {
				error(400, { message: 'Invalid project ID' });
			}

			console.log('form', form);

			const [project] = await db
				.select()
				.from(projectTable)
				.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
				.limit(1);

			console.log('project', project);

			if (!project) {
				error(404, { message: 'Project not found' });
			}

			const [build] = await db
				.select()
				.from(outputTable)
				.where(and(eq(outputTable.projectId, id), eq(outputTable.running, true), eq(outputTable.id, form.buildId)))
				.limit(1);

			console.log('build', build);

			if (!build) {
				error(400, { message: 'No build' });
			}

			await db.update(outputTable).set({ running: false }).where(eq(outputTable.id, build.id));

			redirect(302, `/project/${id}/builds`);
		}
	)
};
