import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { projectTable, type Project } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { z } from 'zod';
import { validateForm } from '$lib';
import { and, eq } from 'drizzle-orm';
import { getFileContentString, hasFile, uploadFile } from '$lib/server/s3';
import showdown from 'showdown';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project }: { project: Project } = await parent();

	if (project.driveFolderId) {
		redirect(302, `/project/${project.id}`);
	}

	const hasProjectFile = await hasFile(project.folderId);
	if (!hasProjectFile) {
		return {};
	}

	let md = await getFileContentString(project.folderId);
	if (!md) {
		return {};
	}

	const converter = new showdown.Converter();

	try {
		return { html: converter.makeHtml(md) };
	} catch (e) {
		console.error(e);
	}
};

export const actions: Actions = {
	upload: validateForm(
		z.object({
			file: z.instanceof(File)
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
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

			const fileId = project.folderId;
			await uploadFile(fileId, form.file);
		}
	)
};
