import { generateId, MAX_FILE_SIZE, validateForm } from '$lib';
import { db } from '$lib/server/db';
import { stylesTable } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { unzip } from 'unzipit';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { styleSettingsTable, requiredFilesTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { findAllSettings } from '$lib/server/tex';
import { uploadFile } from '$lib/server/s3';

export const load: PageServerLoad = async () => {
	const styles = await db.select().from(stylesTable);

	return { styles };
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
			const isZip = header[0] !== 0x50 || header[1] !== 0x4b || header[2] !== 0x03 || header[3] !== 0x04;

			try {
				if (isZip) {
					const { entries } = await unzip(buffer);

					// print all entries and their sizes
					for (const [name, entry] of Object.entries(entries)) {
						// skip directories
						if (name.endsWith('/')) {
							continue;
						}

						const isMainFile = name === 'main.tex';
						if (isMainFile) {
							const content = await entry.text();
							const settings = await findAllSettings(content);
							const id = generateId();
							await uploadFile(id, entry);
							await db.update(stylesTable).set({ mainFile: id }).where(eq(stylesTable.id, styleId));

							await db.delete(styleSettingsTable).where(eq(styleSettingsTable.styleId, styleId));
							for (const [setting, comment] of settings) {
								if (setting === undefined || comment === undefined) {
									continue;
								}

								await db.insert(styleSettingsTable).values({
									id: generateId(),
									styleId,
									key: setting,
									value: '',
									comment
								});
							}

							continue;
						}

						const id = generateId();
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

			await db.update(stylesTable).set({ mainFile: id }).where(eq(stylesTable.id, styleId));

			return redirect(303, '/styles/' + styleId);
		}
	)
};
