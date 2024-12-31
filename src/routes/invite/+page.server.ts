import { validateInviteToken } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { Cookies } from '$lib/server/cookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		redirect(302, '/login');
	}

	const validated = await validateInviteToken(token);
	if (!validated) {
		redirect(302, '/login');
	}

	cookies.set(Cookies.INVITE_TOKEN, validated.token, { path: '/' });

	redirect(302, '/project/' + validated.projectId);
};
