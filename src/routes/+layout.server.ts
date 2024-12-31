import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.user) {
		return { user: locals.user, isShared: false };
	}

	const isShared = !!locals.invite;
	return { user: null, isShared };
};
