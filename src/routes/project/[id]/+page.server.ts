import { generateId, validateForm } from '$lib';
import { db } from '$lib/server/db';
import {
	outputTable,
	projectSettingsTable,
	projectTable,
	requiredFilesTable,
	styleSettingsTable,
	stylesTable
} from '$lib/server/db/schema';
import {
	copyFileToProjectFolder,
	downloadFolder,
	getFileIdByName,
	getNestedFolderId
} from '$lib/server/drive';
import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { buildTex, clearFolder, downloadStyleFiles, writeMainFile } from '$lib/server/tex';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const id = params.id;
	const [project] = await db.select().from(projectTable).where(eq(projectTable.id, id)).limit(1);

	if (!project) {
		error(404, 'Project not found');
	}

	const [style] = await db
		.select()
		.from(stylesTable)
		.where(eq(stylesTable.id, project.styleId))
		.limit(1);

	const files = await db
		.select()
		.from(requiredFilesTable)
		.where(
			and(eq(requiredFilesTable.stylesId, project.styleId), eq(requiredFilesTable.override, 1))
		);

	const settings = await db
		.select({
			id: projectSettingsTable.id,
			key: styleSettingsTable.key,
			value: projectSettingsTable.value,
			comment: styleSettingsTable.comment
		})
		.from(styleSettingsTable)
		.where(eq(projectSettingsTable.projectId, id))
		.leftJoin(projectSettingsTable, eq(projectSettingsTable.setting, styleSettingsTable.id))
		.orderBy(styleSettingsTable.key);

	const outputs = await db
		.select()
		.from(outputTable)
		.where(eq(outputTable.projectId, id))
		.orderBy(desc(outputTable.timestamp));

	return { project, style, files, settings, outputs };
};

export const actions: Actions = {
	reset: validateForm(
		z.object({
			fileId: z.string()
		}),
		async ({ params, locals }, form) => {
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

			const [file] = await db
				.select()
				.from(requiredFilesTable)
				.where(eq(requiredFilesTable.id, form.fileId))
				.limit(1);

			if (!file || !project) {
				error(404, { message: 'File not found' });
			}

			await copyFileToProjectFolder(locals.session, file, project.folderId);
			redirect(302, `/project/${id}`);
		}
	),
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
			error(400, { message: 'Build already running' });
		}

		const [style] = await db
			.select()
			.from(stylesTable)
			.where(eq(stylesTable.id, project.styleId))
			.limit(1);

		if (!style) {
			error(404, { message: 'Style not found' });
		}

		const buildId = generateId();
		await db.update(outputTable).set({ running: false }).where(eq(outputTable.projectId, id));
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
			await clearFolder(project);
		}

		await downloadFolder(locals.session, project.folderId);
		await downloadStyleFiles(project, style);
		await writeMainFile(project, style);

		await buildTex(project, buildId);
	},
	'update-setting': validateForm(
		z.object({
			id: z.string(),
			value: z.string().optional()
		}),
		async ({ locals, params }, form) => {
			if (!locals.user) {
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

			await db
				.update(projectSettingsTable)
				.set({
					value: form.value
				})
				.where(
					and(eq(projectSettingsTable.id, form.id), eq(projectSettingsTable.projectId, projectId))
				);
		}
	),
	openGDFolder: validateForm(
		z.object({
			fileId: z.string()
		}),
		async ({ locals, params }, form) => {
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

			const [file] = await db
				.select()
				.from(requiredFilesTable)
				.where(eq(requiredFilesTable.id, form.fileId))
				.limit(1);

			const path = file.path.split('/');
			const name = path.pop()!;

			const folderId = await getNestedFolderId(locals.session, project.folderId, path.join('/'));
			let url = `https://drive.google.com/drive/folders/${folderId}`;

			const fileId = await getFileIdByName(locals.session, folderId, name);
			if (fileId) {
				url += `?usp=drivesdk&selected=${fileId}`;
			} else {
				await copyFileToProjectFolder(locals.session, file, project.folderId);
			}

			redirect(302, url);
		}
	),
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
	},
	resetSettings: async ({ locals, params }) => {
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

		const [style] = await db
			.select()
			.from(stylesTable)
			.where(eq(stylesTable.id, project.styleId))
			.limit(1);

		if (!style) {
			error(404, { message: 'Style not found' });
		}

		await db.delete(projectSettingsTable).where(eq(projectSettingsTable.projectId, projectId));
		const settings = await db
			.select()
			.from(styleSettingsTable)
			.where(eq(styleSettingsTable.styleId, style.id));

	
		for (const setting of settings) {
			await db.insert(projectSettingsTable).values({
				id: generateId(),
				projectId,
				setting: setting.id,
				value: setting.value
			});
		}
	}
};
