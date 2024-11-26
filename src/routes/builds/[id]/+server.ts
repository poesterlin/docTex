import { db } from '$lib/server/db';
import { outputTable, projectTable } from '$lib/server/db/schema';
import { getFileResponseStream } from '$lib/server/s3';
import { error, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		error(401, { message: 'Unauthorized' });
	}

	const { id } = params;

	if (!id) {
		error(400, { message: 'Invalid build ID' });
	}

	// Fetch the build from the database
	const [build] = await db.select().from(outputTable).where(eq(outputTable.id, id)).limit(1);

	if (!build || build.running || !build.fileId) {
		error(404, { message: 'Build not found' });
	}

	const [project] = await db
		.select()
		.from(projectTable)
		.where(eq(projectTable.id, build.projectId))
		.limit(1);

	if (!project || project.userId !== locals.user.id) {
		error(403, { message: 'Forbidden' });
	}

	return getFileResponseStream(build.id);
};
