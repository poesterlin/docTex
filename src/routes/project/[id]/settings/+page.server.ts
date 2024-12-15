import { generateId, validateForm } from '$lib';
import { db } from '$lib/server/db';
import { projectSettingsTable, projectTable, styleSettingsTable, stylesTable, type Project } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions } from './$types';

export const load = async ({ locals, parent }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const { project }: { project: Project } = await parent();

	if (!project) {
		error(404, 'Project not found');
	}

	const { id } = project;

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

	return { project, settings };
};

export const actions: Actions = {
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
				.where(and(eq(projectSettingsTable.id, form.id), eq(projectSettingsTable.projectId, projectId)));
		}
	),
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

		const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, project.styleId)).limit(1);

		if (!style) {
			error(404, { message: 'Style not found' });
		}

		await db.delete(projectSettingsTable).where(eq(projectSettingsTable.projectId, projectId));
		const settings = await db.select().from(styleSettingsTable).where(eq(styleSettingsTable.styleId, style.id));

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
