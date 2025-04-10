import { assert, generateId, validateForm } from '$lib';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import { projectSettingsTable, projectTable, styleSettingsTable, stylesTable } from '$lib/server/db/schema';
import { createDocInFolder } from '$lib/server/docs';
import { createOrGetFolder } from '$lib/server/drive';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();

	if (!user) {
		if (locals.invite?.projectId) {
			const [project] = await db.select().from(projectTable).where(eq(projectTable.id, locals.invite.projectId)).limit(1);

			if (project) {
				return redirect(302, `/project/${locals.invite.projectId}`);
			}
		}

		return redirect(302, '/intro');
	}

	const projects = await db.select().from(projectTable).where(eq(projectTable.userId, user.id));

	const styles = await db.select().from(stylesTable);

	return { projects, styles, user };
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/login');
	},
	setup: validateForm(
		z.object({
			name: z.string(),
			styleId: z.string(),
			createFolder: z
				.string()
				.default('off')
				.transform((value) => value === 'on')
		}),
		async ({ locals }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const session = locals.session;
			assert(session);

			let googleFolder: string | undefined;

			// only create folder if the user wants to
			if (form.createFolder) {
				googleFolder = await createOrGetFolder(session, form.name, 'root');
				assert(googleFolder);
			}

			const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, form.styleId)).limit(1);

			if (!style) {
				return fail(400, { message: 'Style not found' });
			}

			const id = generateId();
			await db.insert(projectTable).values({
				id,
				name: form.name,
				styleId: form.styleId,
				userId: locals.user.id,
				folderId: generateId(),
				driveFolderId: googleFolder
			});

			const settings = await db.select().from(styleSettingsTable).where(eq(styleSettingsTable.styleId, form.styleId));

			for (const setting of settings) {
				await db.insert(projectSettingsTable).values({
					id: generateId(),
					projectId: id,
					setting: setting.id,
					value: setting.value
				});
			}

			if (!googleFolder) {
				return redirect(302, `/project/${id}`);
			}

			await createDocInFolder(session, googleFolder, form.name);

			redirect(302, `/project/${id}`);
		}
	)
};
