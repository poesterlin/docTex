import { env } from '$env/dynamic/private';
import { exec } from 'child_process';
import { eq, sql } from 'drizzle-orm';
import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { db } from './db';
import {
	bibliographyTable,
	type Output,
	outputTable,
	type Project,
	projectSettingsTable,
	requiredFilesTable,
	type Style,
	styleSettingsTable
} from './db/schema';
import { getFileContentString, uploadFileFromPath } from './s3';
import { rm, readFile } from 'fs/promises';
import { removeSpaces } from './drive';
import ImageMagic from 'imagemagick';
import { generateId } from '$lib';
import { fixCitationKeys } from './transform';
import { $ } from 'bun';

export async function substituteSettings(contents: string, settings: Record<string, string | boolean>) {
	const lines = contents.split('\n');

	const newLines = lines.map((line) => {
		for (const [key, value] of Object.entries(settings)) {
			const prefixedKey = `SETTING_${key}`;
			const conditionalKey = `#IF_SETTING_${key}#`;
			if (!line.includes(prefixedKey)) {
				continue;
			}

			if (line.includes(conditionalKey)) {
				if (!value) {
					return '';
				}

				line = line.replace(conditionalKey, '');
			}

			if (typeof value === 'boolean') {
				return line;
			}

			return line.replace(prefixedKey, value);
		}

		return line;
	});

	return newLines.join('\n');
}

export async function findAllSettings(contents: string): Promise<[string, string][]> {
	const lines = contents.split('\n');

	const settings = new Set<string>();
	const optionalSettings = new Set<string>();

	for (const line of lines) {
		const match = line.match(/SETTING_([A-Z_]+)/);
		if (!match) {
			continue;
		}

		settings.add(match[1]);

		const conditionalMatch = line.includes(`#IF_SETTING_${match[1]}#`);
		if (conditionalMatch) {
			optionalSettings.add(match[1]);
		}
	}

	return Array.from(settings.entries()).map(([key]) => [key, optionalSettings.has(key) ? 'optional' : '']);
}

export async function getSettings(project: Project, style: Style) {
	const baseSettings = await db.select().from(styleSettingsTable).where(eq(styleSettingsTable.styleId, style.id)).limit(1);

	const settings = settingsToObject(baseSettings);

	const projectSettings = await db
		.select({
			key: styleSettingsTable.key,
			value: projectSettingsTable.value
		})
		.from(styleSettingsTable)
		.where(eq(projectSettingsTable.projectId, project.id))
		.leftJoin(projectSettingsTable, eq(projectSettingsTable.setting, styleSettingsTable.id));

	const overrideSettings = settingsToObject(projectSettings);

	return { ...settings, ...overrideSettings };
}

export async function writeMainFile(project: Project, style: Style) {
	const settings = await getSettings(project, style);
	const content = await getFileContentString(style.mainFile);

	let res = await substituteSettings(content, settings);
	res = fixCitationKeys(res);

	const markdownInputFile = removeSpaces(project.name) + '.md';
	const inputContent = await readFile(join(env.TMP_DIR, project.folderId, markdownInputFile), 'utf-8');
	const markdownHeader = `\\markdownBegin{}`;
	const markdownFooter = `\\markdownEnd{}`;
	res = res.replace(
		'#INCLUDE_CHAPTERS',
		`${markdownHeader}
${inputContent}
${markdownFooter}
`
	);

	const path = join(env.TMP_DIR, project.folderId, 'main.tex');
	await writeFile(path, res);
}

export async function updateWordCount(project: Project, buildId: string) {
	const path = join(env.TMP_DIR, project.folderId, removeSpaces(project.name) + '.md');
	const inputContent = await readFile(path, 'utf-8');
	const wordCount = inputContent.split(/\s+/).length;

	await db.update(outputTable).set({ wordCount }).where(eq(outputTable.id, buildId));
}

function settingsToObject(settings: any) {
	const result: Record<string, string> = {};

	for (const setting of settings) {
		result[setting.key] = setting.value;
	}

	return result;
}

export async function buildTex(project: Project, id: string) {
	// TODO: setup postgres listener to abort build if user cancels

	const path = join(env.TMP_DIR, project.folderId);

	// const maxTime = 1000 * 60 * 5; // 5 minutes
	// const signal = AbortSignal.timeout(maxTime);

	try {
		const command = $`/tex/entrypoint.sh"`.cwd(path).nothrow();

		for await (let line of command.lines()) {
			console.log(line);
			// append the line to the output
			await db.update(outputTable).set({ logs: sql`append(logs, ${line})` })
				.where(eq(outputTable.id, id));
		}
	} catch (error) {
		console.error('Failed to build tex', error);
	}		

	const build: Partial<Output> = {
		timestamp: new Date(),
		projectId: project.id,
		running: false,
		thumbnail: null
	};

	// wait for the file to be written
	await new Promise((resolve) => setTimeout(resolve, 1000));

	const outputPath = join(path, 'main.pdf');
	const hasOutputFile = await stat(outputPath)
		.then(() => true)
		.catch(() => false);

	if (hasOutputFile) {
		await uploadFileFromPath(id, outputPath);
		build.fileId = id;

		try {
			const thumbnailPath = join(path, 'output_thumbnail.png');
			await new Promise<void>((resolve, reject) => {
				ImageMagic.convert(
					['-thumbnail', 'x600', '-background', 'white', '-alpha', 'remove', outputPath + '[0]', thumbnailPath],
					function (err, stdout) {
						if (err) {
							return reject(new Error('Failed to generate thumbnail'));
						}

						console.log('stdout:', stdout);
						resolve();
					}
				);
			});

			const thumbnailId = generateId();
			await uploadFileFromPath(thumbnailId, thumbnailPath);
			build.thumbnail = thumbnailId;
		} catch (error) {
			console.error('Failed to generate thumbnail', error);
		}
	}

	await db.update(outputTable).set(build).where(eq(outputTable.id, id));
}

export async function downloadStyleFiles(project: Project, style: Style) {
	const files = await db.select().from(requiredFilesTable).where(eq(requiredFilesTable.stylesId, style.id));

	for (const file of files) {
		const content = await getFileContentString(file.id);
		const path = join(env.TMP_DIR, project.folderId, file.path);

		const isAlreadyDownloaded =
			file.override &&
			(await stat(path)
				.then(() => true)
				.catch(() => false));

		if (isAlreadyDownloaded) {
			continue;
		}

		const folder = path.split('/').slice(0, -1).join('/');

		if (folder) {
			await mkdir(folder, { recursive: true });
		}

		try {
			await writeFile(path, content);
		} catch (error) {
			console.error('Failed to download file', error);
		}
	}
}

export async function clearFolder(project: Project) {
	const path = join(env.TMP_DIR, project.folderId);
	try {
		await rm(path, { recursive: true });
	} catch (error) { }
}

export async function createBibliography(project: Project) {
	const bibs = await db
		.select({
			content: bibliographyTable.content
		})
		.from(bibliographyTable)
		.where(eq(bibliographyTable.projectId, project.id))
		.orderBy(bibliographyTable.key);

	const content = bibs.map((bib) => bib.content).join('\n');
	const path = join(env.TMP_DIR, project.folderId, 'bibliography.bib');

	console.log('Writing bibliography to', path);
	console.log('Bibliography:', content);

	await writeFile(path, content);
}
