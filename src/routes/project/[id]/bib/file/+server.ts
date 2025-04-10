import { bibliographyTable, projectTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import { getFileResponseStream } from '$lib/server/s3';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { id } = params;
	const bibId = url.searchParams.get('id');

	if (!bibId) {
		return error(400, { message: 'Missing bibliography ID' });
	}

	const project = await db
		.select()
		.from(projectTable)
		.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
		.limit(1);

	if (!project) {
		return error(404, { message: 'Project not found' });
	}

	const [bibliography] = await db.select().from(bibliographyTable).where(eq(bibliographyTable.id, bibId)).limit(1);
	const fileId = bibliography?.fileId;

	if (!fileId) {
		return error(404, { message: 'File not found' });
	}

	return getFileResponseStream(fileId);
};
