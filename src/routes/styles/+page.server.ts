import { generateId, MAX_FILE_SIZE, validateForm } from '$lib';
import { db } from '$lib/server/db';
import { requiredFilesTable, styleSettingsTable, stylesTable } from '$lib/server/db/schema';
import { uploadFile } from '$lib/server/s3';
import { getSettingsFromFile } from '$lib/server/tex';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { unzip } from 'unzipit';
import { z } from 'zod';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const styles = await db.select().from(stylesTable);
	const { user } = await parent();

	return { styles, user };
};

export const actions = {
	setup: validateForm(
		z.object({
			name: z.string().min(3),
			description: z.string().min(3),
			file: z.instanceof(File).refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 25MB.`)
		}),
		async ({ locals }, form) => {
			if (!locals.user) {
				return redirect(302, '/login');
			}

			const styleId = generateId();
			await db.insert(stylesTable).values({
				id: styleId,
				name: form.name,
				mainFile: styleId,
				description: form.description,
				authorId: locals.user.id
			});

			const file = form.file;
			const buffer = await file.arrayBuffer();

			// test if the buffer is a zip file
			// zip header: 0x50, 0x4b, 0x03, 0x04
			const header = new Uint8Array(buffer, 0, 4);
			const isZip = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;

			try {
				if (isZip) {
					const { entries } = await unzip(buffer);

					// print all entries and their sizes
					for (const [name, entry] of Object.entries(entries)) {
						// skip directories
						if (name.endsWith('/')) {
							continue;
						}

						const id = generateId();
						const isMainFile = name === 'main.tex';
						if (isMainFile) {
							await uploadFile(id, entry);

							// set file to be the main file of the style
							await db.update(stylesTable).set({ mainFile: id }).where(eq(stylesTable.id, styleId));

							const settings = await getSettingsFromFile(entry, styleId);
							if (settings.length > 0) {
								await db.insert(styleSettingsTable).values(settings);
							}

							continue;
						}

						await db.insert(requiredFilesTable).values({
							id,
							name: name,
							description: '',
							path: name,
							stylesId: styleId,
							mimeType: 'application/octet-stream',
							default: id,
							override: 1
						});
						await uploadFile(id, entry);
					}

					return redirect(303, '/styles/' + styleId);
				}
			} catch (e) {
				console.log(e);
			}

			// single main file
			const id = generateId();
			await uploadFile(id, file);

			await db.insert(requiredFilesTable).values({
				id,
				name: 'main.tex',
				description: form.description,
				mimeType: file.type,
				stylesId: styleId,
				default: id,
				override: 0,
				path: '/main.tex'
			} satisfies typeof requiredFilesTable.$inferInsert);

			// set file to be the main file of the style
			await db.update(stylesTable).set({ mainFile: id }).where(eq(stylesTable.id, styleId));

			const settings = await getSettingsFromFile(file, styleId);
			if (settings.length > 0) {
				await db.insert(styleSettingsTable).values(settings);
			}

			return redirect(303, '/styles/' + styleId);
		}
	)
};
