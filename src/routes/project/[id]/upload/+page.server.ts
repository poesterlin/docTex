import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { projectFilesTable, projectTable, requiredFilesTable, type Project } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { z } from 'zod';
import { generateId, validateForm } from '$lib';
import { and, eq } from 'drizzle-orm';
import { deleteFile, getFileContentString, hasFile, uploadFile } from '$lib/server/s3';
import showdown from 'showdown';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project }: { project: Project } = await parent();

	if (project.driveFolderId) {
		redirect(302, `/project/${project.id}`);
	}

	const files = await db
		.select()
		.from(requiredFilesTable)
		.leftJoin(projectFilesTable, eq(projectFilesTable.fileId, requiredFilesTable.id))
		.where(and(eq(requiredFilesTable.stylesId, project.styleId), eq(requiredFilesTable.override, 1)));

	const hasProjectFile = await hasFile(project.folderId);
	if (!hasProjectFile) {
		return { files };
	}

	let md = await getFileContentString(project.folderId);
	if (!md) {
		return { files };
	}

	const converter = new showdown.Converter();

	try {
		return { html: converter.makeHtml(md), files };
	} catch (e) {
		console.error(e);
	}
};

export const actions: Actions = {
	upload: validateForm(
		z.object({
			file: z.instanceof(File),
			replaceFile: z.string().optional()
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			// TODO: add file size limit per user

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

			// store the file as a project file
			if (!form.replaceFile) {
				const fileId = project.folderId;
				await uploadFile(fileId, form.file);
				return;
			}

			const [styleFile] = await db
				.select()
				.from(requiredFilesTable)
				.where(
					and(
						eq(requiredFilesTable.id, form.replaceFile),
						eq(requiredFilesTable.stylesId, project.styleId),
						eq(requiredFilesTable.override, 1)
					)
				)
				.limit(1);

			if (!styleFile) {
				error(400, { message: 'Invalid file ID' });
			}

			const [existingFile] = await db
				.select()
				.from(projectFilesTable)
				.where(and(eq(projectFilesTable.projectId, project.id), eq(projectFilesTable.fileId, form.replaceFile)));

			if (existingFile) {
				await db.delete(projectFilesTable).where(eq(projectFilesTable.id, existingFile.id));
				await deleteFile(existingFile.fileId);
			}

			const uploadId = generateId();
			await db.insert(projectFilesTable).values({ id: uploadId, projectId: project.id, fileId: form.replaceFile });
			await uploadFile(uploadId, form.file);
		}
	),

	reset: validateForm(
		z.object({
			fileId: z.string()
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

			await db.delete(projectFilesTable).where(and(eq(projectFilesTable.projectId, project.id), eq(projectFilesTable.id, form.fileId)));
			await deleteFile(form.fileId);
		}
	)
};
