import { validateForm, assert, generateId } from '$lib';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import { projectTable, stylesTable } from '$lib/server/db/schema';
import { createFolder } from '$lib/server/drive';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	const projects = await db
		.select()
		.from(projectTable)
		.where(eq(projectTable.userId, locals.user.id));

	const styles = await db.select().from(stylesTable);

	return { projects, styles };
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
		}),
		async ({ locals }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const session = locals.session;
			assert(session);

			const folderId = await createFolder(session, form.name);
			assert(folderId);

			const [style] = await db
				.select()
				.from(stylesTable)
				.where(eq(stylesTable.id, form.styleId))
				.limit(1);

			if (!style) {
				return fail(400, { message: 'Style not found' });
			}

			const id = generateId();
			await db.insert(projectTable).values({
				id,
				name: form.name,
				styleId: form.styleId,
				userId: locals.user.id,
				folderId,
			});

			redirect(302, `/project/${id}`);
		})
};
