import { assert, validateForm } from '$lib';
import { getAIResponse, uploadFile } from '$lib/server/ai';
import { db } from '$lib/server/db';
import { aiFilesTable, bibliographyTable, projectFilesTable, projectTable } from '$lib/server/db/schema';
import { getFileResponseStream } from '$lib/server/s3';
import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project } = await parent();

	if (!project) {
		error(404, 'Project not found');
	}

	const projectFiles = await db
		.select({ fileId: projectFilesTable.fileId })
		.from(projectFilesTable)
		.where(eq(projectFilesTable.projectId, project.id));
	const bibFiles = await db
		.select({ fileId: bibliographyTable.fileId })
		.from(bibliographyTable)
		.where(and(eq(bibliographyTable.projectId, project.id), isNotNull(bibliographyTable.fileId)));
	const aiFiles = await db.select({ id: aiFilesTable.id }).from(aiFilesTable).where(eq(aiFilesTable.projectId, project.id));

	const fileIds = bibFiles
		.concat(projectFiles)
		.map((file) => file.fileId)
		.filter(Boolean) as string[];
	const aiFileIds = new Set(aiFiles.map((file) => file.id));

	const filesToUpload = fileIds.filter((fileId) => fileId); // && !aiFileIds.has(fileId));
	console.log('Files to upload:', filesToUpload);
	console.log('AI files:', aiFiles);

	await Promise.allSettled(
		filesToUpload.map(async (fileId) => {
			const response = await getFileResponseStream(fileId);
			const blob = await response.blob();

			const { uri, mimeType } = await uploadFile(blob, fileId);
			assert(uri);

			return await db
				.insert(aiFilesTable)
				.values({
					id: fileId,
					projectId: project.id,
					fileId: fileId,
					mimeType: mimeType ?? blob.type,
					uri
				} satisfies typeof aiFilesTable.$inferInsert)
				.returning({ id: aiFilesTable.id });
		})
	);
};

export const actions: Actions = {
	message: validateForm(
		z.object({
			message: z.string().min(1, 'Message is required')
		}),
		async ({ locals, params }, form) => {
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

			const aiFiles = await db.select().from(aiFilesTable).where(eq(aiFilesTable.projectId, project.id));
			console.log('AI files:', aiFiles);
			console.log('Form message:', form.message);

			try {
				const stream = await getAIResponse(form.message, aiFiles);

				let response = '';
				for await (const chunk of stream) {
					response += chunk.text;
				}

				return { message: response };
			} catch (e) {
				console.error('Error getting AI response:', e);
				return fail(500, { message: 'Error getting AI response' });
			}
		}
	)
};
