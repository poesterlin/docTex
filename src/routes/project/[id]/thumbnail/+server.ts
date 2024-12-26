import { db } from '$lib/server/db';
import { outputTable, projectTable } from '$lib/server/db/schema';
import { getFileResponseStream } from '$lib/server/s3';
import { error, type RequestHandler } from '@sveltejs/kit';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, { message: 'Unauthorized' });
	}

	const { id } = params;

	if (!id) {
		error(400, { message: 'Invalid project ID' });
	}

	const [project] = await db.select().from(projectTable).where(eq(projectTable.id, id)).limit(1);

	if (!project) {
		error(404, { message: 'Project not found' });
	}

	if (project.userId !== locals.user.id) {
		error(404, { message: 'Thumbnail not found' });
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
