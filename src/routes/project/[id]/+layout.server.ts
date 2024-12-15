import { db } from '$lib/server/db';
import {
	projectTable,
	stylesTable,
	requiredFilesTable,
	projectSettingsTable,
	styleSettingsTable,
	outputTable
} from '$lib/server/db/schema';
import { redirect, error } from '@sveltejs/kit';
import { eq, and, desc } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const id = params.id;
	const [project] = await db.select().from(projectTable).where(eq(projectTable.id, id)).limit(1);

	if (!project) {
		error(404, 'Project not found');
	}

	return { project };
};
