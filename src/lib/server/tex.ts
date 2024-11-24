import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { db } from './db';
import {
	type Project,
	type Style,
	styleSettingsTable,
	projectSettingsTable,
	outputTable
} from './db/schema';
import { getFileContentString, uploadFile, uploadFileFromPath } from './s3';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { generateId } from '$lib';

export async function substituteSettings(
	contents: string,
	settings: Record<string, string | boolean>
) {
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

	return Array.from(settings.entries()).map(([key]) => [
		key,
		optionalSettings.has(key) ? 'optional' : ''
	]);
}

export async function getSettings(project: Project, style: Style) {
	const baseSettings = await db
		.select()
		.from(styleSettingsTable)
		.where(eq(styleSettingsTable.styleId, style.id))
		.limit(1);

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
	res = res.replace('#INCLUDE_CHAPTERS', `\\markdownInput{${project.name}.md}`);

	const path = join(env.TMP_DIR, project.folderId, 'main.tex');
	await writeFile(path, res);
}

function settingsToObject(settings: any) {
	const result: Record<string, string> = {};

	for (const setting of settings) {
		result[setting.key] = setting.value;
	}

	return result;
}

export async function buildTex(project: Project) {
	const path = join(env.TMP_DIR, project.folderId);
	const command = `/tex/entrypoint.sh`;

	exec(command, { cwd: path }, async (error, stdout, stderr) => {
		console.log({ stdout, stderr, error });

		const id = generateId();
		await db.insert(outputTable).values({
			id,
			projectId: project.id,
			logs: stdout,
			errors: error + stderr
		});

		if (!error) {
			await uploadFileFromPath(id, join(path, 'main.pdf'));
		}
	});
}
