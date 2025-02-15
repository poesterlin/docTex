import { env } from '$env/dynamic/private';
import { generateId } from '$lib';
import { toSVG } from '$lib/server/data';
import { db } from '$lib/server/db';
import { outputTable, projectFilesTable, projectTable, requiredFilesTable, stylesTable, type Project } from '$lib/server/db/schema';
import { downloadFolder, removeSpaces } from '$lib/server/drive';
import { downloadFileToPath } from '$lib/server/s3';
import {
	buildTex,
	clearFolder,
	createBibliography,
	createFolder,
	downloadStyleFiles,
	updateWordCount,
	writeMainFile
} from '$lib/server/tex';
import { error, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { join } from 'path';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	let project: Project | null = null;
	const parentData = await parent();
	const { user } = parentData;

	// If user is not logged in, check if they are invited to a project
	if (locals.invite) {
		const [result] = await db.select().from(projectTable).where(eq(projectTable.id, locals.invite.projectId)).limit(1);
		project = result;
	} else if (locals.user) {
		project = parentData.project;
	} else {
		redirect(302, '/login');
	}

	if (!project) {
		error(404, 'Project not found');
	}

	const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, project.styleId)).limit(1);
	const [build] = await db
		.select()
		.from(outputTable)
		.where(eq(outputTable.projectId, project.id))
		.orderBy(desc(outputTable.timestamp))
		.limit(1);

	const wordHistory = await db
		.select({ count: outputTable.wordCount, date: outputTable.timestamp })
		.from(outputTable)
		.orderBy(asc(outputTable.timestamp))
		.where(eq(outputTable.projectId, project.id));

	return { user: user ?? null, project, build, style, wordHistory: toSVG(wordHistory) };
};

async function appendOutputLog(buildId: string, newLogs: string) {
	await db
		.update(outputTable)
		.set({
			logs: sql`CONCAT(${outputTable.logs}, cast(${newLogs} as text))`
		})
		.where(eq(outputTable.id, buildId));
}

export const actions: Actions = {
	build: async ({ params, locals }) => {
		if (!locals.user || !locals.session) {
			redirect(302, '/login');
		}

		// TODO: migrate to offline token to allow invited users to build

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

		if (lastBuild?.running) {
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
			running: true,
			wordCount: 0
		});

		// Clear folder if last build was not successful, preserving cache
		if (lastBuild && !lastBuild.fileId) {
			await appendOutputLog(buildId, 'Clearing folder...\n');
			await clearFolder(project);
		}

		await createFolder(project);

		console.log('Downloading files...');

		// for projects with drive folder
		if (project.driveFolderId) {
			const path = join(env.TMP_DIR, project.folderId);
			await downloadFolder(locals.session, project.driveFolderId, path);
			await appendOutputLog(buildId, 'Downloading files...\n');
			await downloadStyleFiles(project, style);
		} else {
			// for projects with user-uploaded files

			// download main file
			const path = join(env.TMP_DIR, project.folderId, removeSpaces(project.name) + '.md');
			await downloadFileToPath(project.folderId, path);

			// download required files
			await appendOutputLog(buildId, 'Downloading files...\n');
			await downloadStyleFiles(project, style);

			const projectFiles = await db
				.select()
				.from(projectFilesTable)
				.innerJoin(requiredFilesTable, eq(projectFilesTable.fileId, requiredFilesTable.id))
				.where(eq(projectFilesTable.projectId, id));

			// overwrite files with user-uploaded files
			for (const file of projectFiles) {
				try {
					const path = join(env.TMP_DIR, project.folderId, file.required_files.path);
					await downloadFileToPath(file.project_files.id, path);
				} catch (e) {
					await appendOutputLog(buildId, `Failed to download file ${file.required_files.name}\n`);
				}
			}
		}

		await createBibliography(project);

		try {
			await appendOutputLog(buildId, 'Writing main file...\n');
			await writeMainFile(project, style);
			await updateWordCount(project, buildId);
			await appendOutputLog(buildId, 'Building...\n');

			await buildTex(project, buildId);
		} catch (error: unknown) {
			if (typeof error === 'string') {
				await appendOutputLog(buildId, `ERROR: ${error}\n`);
			}

			if (error instanceof Error) {
				await appendOutputLog(buildId, `ERROR: ${error.message}\n`);
			}

			await db.update(outputTable).set({ running: false }).where(eq(outputTable.id, buildId));
			console.error(error);
		}

		redirect(302, `/project/${id}/builds`);
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
