import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileTypeToExtension } from './drive';

export async function storeAndReplaceDataImages(markdown: string, baseFolder: string) {
	// find all images in this format:
	// ![][image1]

	const imageRegex = /!\[\]\[(image\d+)\]/g;
	let matches: any = [];

	if (markdown.matchAll) {
		matches = markdown.matchAll(imageRegex);
	} else {
		let match;
		while ((match = imageRegex.exec(markdown)) !== null) {
			matches.push(match);
		}
	}

	for (const match of matches) {
		const id = match[1];

		// find all the image definitions
		const imageDefinitionRegex = new RegExp(`\\[${id}\\]: <data:(.+?)>`, 'g');
		const imageDefinitionMatch = imageDefinitionRegex.exec(markdown);

		if (!imageDefinitionMatch) {
			console.log(`No image definition found for ${id}`);
			continue;
		}

		const dataUrl = imageDefinitionMatch[1];
		const parts = dataUrl.split(';');
		const mimeType = parts[0].split(':')[1];
		const base64 = parts[1].split(',')[1];
		const buffer = Buffer.from(base64, 'base64');
		const extension = fileTypeToExtension[mimeType] ?? 'png';

		const path = `./images/${id}.${extension}`;
		const image = `![](${path}){ width=0.5\\textwidth }`;

		await mkdir(join(baseFolder, 'images'), { recursive: true });
		const outputPath = join(baseFolder, path);
		await writeFile(outputPath, buffer);

		markdown = markdown.replace(imageDefinitionMatch[0], '').replace(match[0], image);
	}

	return markdown;
}

export function fixCitationKeys(markdown: string) {
	// citation keys get exported like this: \[@key2016manual\]
	// but should be: [@key2016manual]

	const bracketOpen = / \\\[/g;
	markdown = markdown.replaceAll(bracketOpen, '[');
	const bracketClose = / \\\]/g;
	markdown = markdown.replaceAll(bracketClose, ']');

	return markdown;
}

export function fixFootnotes(markdown: string) {
	// footnotes get exported like this:

	// `[^1]` as a reference in the main text
	// `[^1]:  footnote text` at the end of the document

	// they should be exported like this: ^[footnote text]

	const footnoteReference = /\[\^(\d+)\][^:]/g;
	const matches = markdown.matchAll(footnoteReference);

	const footnoteDefinition = /\[\^(\d+)\]: (.+?)$/g;

	for (const match of matches) {
		const number = match[1];
		const footnote = new RegExp(`\\[\\^${number}+\\]:\\s+(.+?)$`).exec(markdown);

		if (!footnote) {
			console.log(`No footnote found for ${number}`);
			continue;
		}

		markdown = markdown
		.replace(footnote[0], `^[${footnote[1]}]`) // replace the footnote definition
		.replace(match[0], ''); // remove the footnote reference
	}

	return markdown;
}
