import type { ShareToken } from '$lib/server/db/schema';

// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth').SessionValidationResult['user'];
			session: import('$lib/server/auth').SessionValidationResult['session'];
			invite: ShareToken | undefined;
		}

		interface PageData {
			user: import('$lib/server/auth').SessionValidationResult['user'];
		}
	}
}

export {};
