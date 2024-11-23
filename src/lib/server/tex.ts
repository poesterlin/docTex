import { readFile } from 'fs/promises';

// substituteSettings('./tex/input/main.tex', {
// 	FONTSIZE: '12pt',
// 	PAPERSIZE: 'a4paper',
// 	LANGUAGE: 'english',
// 	TITLE: 'My Document Title',
// 	AUTHOR: 'Author Name',
// 	BIBFILE: 'references.bib',
// 	TYPE: 'Bachelor Thesis',
// 	STUDENTNR: '123456',
// 	GROUP: 'Group 1',
// 	DEPARTMENT: 'Department of Computer Science',
// 	ADVISOR: 'Advisor Name',
// 	REVIEWER: 'Reviewer Name',
// 	ABSTRACT: 'This is the abstract of the document.',
// 	LOF: true,
// 	LOT: true,
// 	APPENDIX: 'appendix.tex'
// });

export async function substituteSettings(
	filename: string,
	settings: Record<string, string | boolean>
) {
    await findAllSettings(filename);
	const contents = await readFile(filename, 'utf-8');
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

    const newContents = newLines.join('\n');
    console.log(newContents);
}


export async function findAllSettings(contents: string) {
    const lines = contents.split('\n');

    const settings= new Set<string>();

    for (const line of lines) {
        const match = line.matchAll(/SETTING_([A-Z_]+)/g);
        for (const m of match) {
            settings.add(m[1]);
        }
    }

    return settings;
}