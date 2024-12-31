import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import { Cookies } from '$lib/server/cookies';

const handleAuth: Handle = async ({ event, resolve }) => {
	const invite = event.cookies.get(Cookies.INVITE_TOKEN);
	if (invite) {
		event.locals.invite = await auth.validateInviteToken(invite);
	}

	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);
	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

export const handle: Handle = handleAuth;
