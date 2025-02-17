import { bibliographyTable, projectTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { id } = params;

	const project = await db
		.select()
		.from(projectTable)
		.where(and(eq(projectTable.id, id), eq(projectTable.userId, locals.user.id)))
		.limit(1);

    if (!project) {
        return error(404, { message: 'Project not found' });
    }

	const bibliography = await db.select().from(bibliographyTable).where(eq(bibliographyTable.projectId, id)).orderBy(bibliographyTable.key);
    const content = bibliography.map((entry) => entry.content).join('\n');

    return new Response(content, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
};
