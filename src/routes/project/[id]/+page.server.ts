import { validateForm } from '$lib';
import { db } from '$lib/server/db';
import { projectTable, requiredFilesTable, stylesTable } from '$lib/server/db/schema';
import { copyFileToProjectFolder, downloadFolder } from '$lib/server/drive';
import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const id = params.id;
	const [project] = await db.select().from(projectTable).where(eq(projectTable.id, id)).limit(1);

	if (!project) {
		error(404, 'Project not found');
	}

	const [style] = await db
		.select()
		.from(stylesTable)
		.where(eq(stylesTable.id, project.styleId))
		.limit(1);

	const files = await db
		.select()
		.from(requiredFilesTable)
		.where(
			and(eq(requiredFilesTable.stylesId, project.styleId), eq(requiredFilesTable.override, 1))
		);

	return { project, style, files };
};

export const actions: Actions = {
	reset: validateForm(
		z.object({
			fileId: z.string()
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

			const [file] = await db
				.select()
				.from(requiredFilesTable)
				.where(eq(requiredFilesTable.id, form.fileId))
				.limit(1);

			if (!file || !project) {
				error(404, { message: 'File not found' });
			}

			await copyFileToProjectFolder(locals.session, file, project.folderId);
			redirect(302, `/project/${id}`);
		}
	),
	build: async ({ params, locals }) => {
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

		// TODO: Build project
		await downloadFolder(locals.session, project.folderId);
	}
};
