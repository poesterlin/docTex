import { generateId } from '$lib';
import { db } from '$lib/server/db';
import { outputTable, projectTable, stylesTable } from '$lib/server/db/schema';
import { downloadFolder } from '$lib/server/drive';
import { buildTex, clearFolder, downloadStyleFiles, writeMainFile } from '$lib/server/tex';
import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project, user } = await parent();

	if (!project) {
		error(404, 'Project not found');
	}

	const { id } = project;

	const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, project.styleId)).limit(1);
	const [build] = await db.select().from(outputTable).where(eq(outputTable.projectId, id)).orderBy(desc(outputTable.timestamp)).limit(1);

	return { user: user ?? null, project, build, style };
};

async function appendOutputLog(buildId: string, newLogs: string) {
	await db
		.update(outputTable)
		.set({
			logs: sql.raw(`CONCAT(logs, '${newLogs}')`)
		})
		.where(eq(outputTable.id, buildId));
}

export const actions: Actions = {
	build: async ({ params, locals }) => {
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

		const [lastBuild] = await db
			.select()
			.from(outputTable)
			.where(eq(outputTable.projectId, id))
			.orderBy(desc(outputTable.timestamp))
			.limit(1);

		if (lastBuild && lastBuild.running) {
			redirect(302, `/project/${id}/builds`);
		}

		const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, project.styleId)).limit(1);

		if (!style) {
			error(404, { message: 'Style not found' });
		}

		const buildId = generateId();
		await db.insert(outputTable).values({
			id: buildId,
			projectId: id,
			timestamp: new Date(),
			logs: '',
			errors: '',
			running: true
		});

		// Clear folder if last build was not successful, preserving cache
		if (lastBuild && !lastBuild.fileId) {
			await appendOutputLog(buildId, 'Clearing folder...\n');
			await clearFolder(project);
		}

		await downloadFolder(locals.session, project.folderId);
		await appendOutputLog(buildId, 'Downloading files...\n');
		await downloadStyleFiles(project, style);
		await appendOutputLog(buildId, 'Writing main file...\n');
		await writeMainFile(project, style);
		await appendOutputLog(buildId, 'Building...\n');

		try {
			await buildTex(project, buildId);
		} catch (error) {
			await db.update(outputTable).set({ running: false }).where(eq(outputTable.id, buildId));
			console.error(error);
		}
	},
	delete: async ({ locals, params }) => {
		if (!locals.user || !locals.session) {
			return redirect(302, '/login');
		}

		const projectId = params.id;
		if (!projectId) {
			error(400, { message: 'Invalid project ID' });
		}

		const [project] = await db
			.select()
			.from(projectTable)
			.where(and(eq(projectTable.id, projectId), eq(projectTable.userId, locals.user.id)))
			.limit(1);

		if (!project) {
			error(404, { message: 'Project not found' });
		}

		await clearFolder(project);
		await db.delete(projectTable).where(eq(projectTable.id, projectId));
		redirect(302, '/');
	}
};
