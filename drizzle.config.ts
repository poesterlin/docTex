import { defineConfig } from 'drizzle-kit';

if (!process.env.POSTGRES_CONNECTION_STRING) {
	throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
    out: "./drizzle",
	dbCredentials: {
        url: process.env.POSTGRES_CONNECTION_STRING,
        ssl: false,
    },
	verbose: true,
	strict: true,
	dialect: 'postgresql',
	// introspect: {
    //     casing: "camel"
    // }
});
