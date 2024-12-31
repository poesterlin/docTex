import { db } from '$lib/server/db';
import { outputTable, projectTable, type Project } from '$lib/server/db/schema';
import { getFileResponseStream } from '$lib/server/s3';
import { error, type RequestHandler } from '@sveltejs/kit';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;
	if (!id) {
		error(400, { message: 'Invalid project ID' });
	}

	let project: Project | null = null;

	// If user is not logged in, check if they are invited to a project
	if (locals.invite) {
		const [result] = await db.select().from(projectTable).where(eq(projectTable.id, locals.invite.projectId)).limit(1);
		project = result;
	} else if (locals.user) {
		const [result] = await db
			.select()
			.from(projectTable)
			.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
			.limit(1);

		project = result;
	} else {
		error(401, 'Unauthorized');
	}

	if (!project) {
		error(404, { message: 'Project not found' });
	}

	// Fetch the build from the database
	const [build] = await db
		.select()
		.from(outputTable)
		.where(and(eq(outputTable.projectId, id), eq(outputTable.running, false), isNotNull(outputTable.thumbnail)))
		.orderBy(desc(outputTable.timestamp))
		.limit(1);

	if (!build?.thumbnail) {
		error(404, { message: 'Build not found' });
	}

	return getFileResponseStream(build.thumbnail);
};
