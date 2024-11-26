import { db } from '$lib/server/db';
import { outputTable } from '$lib/server/db/schema';
import { getFileResponseStream } from '$lib/server/s3';
import { error, type RequestHandler } from '@sveltejs/kit';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id) {
		error(400, { message: 'Invalid project ID' });
	}

	// Fetch the build from the database
	const [build] = await db
		.select()
		.from(outputTable)
		.where(
			and(
				eq(outputTable.projectId, id),
				eq(outputTable.running, false),
				isNotNull(outputTable.fileId)
			)
		)
		.orderBy(desc(outputTable.timestamp))
		.limit(1);

	if (!build) {
		error(404, { message: 'Build not found' });
	}

	return getFileResponseStream(build.id);
};
