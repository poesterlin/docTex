import { db } from '$lib/server/db';
import { outputTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const { id, build } = z
		.object({
			id: z.string(),
			build: z.string()
		})
		.parse(params);

	const [output] = await db
		.select()
		.from(outputTable)
		.where(and(eq(outputTable.projectId, id), eq(outputTable.id, build)))
        .limit(1);

    if (!output) {
        error(404, 'Build not found');
    }

	return json(output);
};
