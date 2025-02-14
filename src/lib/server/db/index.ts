import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

if (!env.POSTGRES_CONNECTION_STRING) {
	throw new Error('POSTGRES_CONNECTION_STRING is not set');
}

const client = postgres(env.POSTGRES_CONNECTION_STRING);
export const db = drizzle(client, { logger: env.POSTGRES_LOG_QUERIES === 'true' });
