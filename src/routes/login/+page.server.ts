import { deleteSessionTokenCookie } from '$lib/server/auth';
import { getAuthInfo } from '$lib/server/google';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}

	deleteSessionTokenCookie(event);
};

export const actions: Actions = {
	authenticate: async ({ cookies }) => {
		const { authorizationUrl, state } = getAuthInfo();

		const expires = Date.now() + 1000 * 60 * 5; // 5 minutes

		cookies.set("state", state, {
			path: "/",
			expires: new Date(expires),
			secure: true
		});

		redirect(303, authorizationUrl);
	},
};
