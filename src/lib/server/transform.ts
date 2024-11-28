import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileTypeToExtension } from './drive';
import type { Parent, Root, Table, Text } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmTable } from 'micromark-extension-gfm-table';

function convertMdTablesToTex(ast: Parent) {
	const children = ast.children;
	/*
		Format:

		\begin{table}[]
		\begin{tabular}{|l|l|l|l|l|} % number of columns
		xyz & \multicolumn{1}{r}{abc} & \multicolumn{1}{c}{efg} & \multicolumn{1}{c}{hij} &  \\ % {r} for right, {c} for center, no need for left
			&                          &                          &                          &  \\ % empty row, separate columns with &
			&                          &                          &                          &  \\ separate rows with \\
			&                          &                          &                          & 
		\end{tabular}
		\end{table} 
	*/

	if (ast.type === 'table') {
		// type hierarchy: "table" -> "tableRow" -> "tableCell" -> "text"
		const table = ast as Table;

		const rows = table.children;
		const numberOfColumns = table.align?.length ?? 0;

		const tableString = rows
			.map((row, i) => {
				const cells = row.children;
				const alignment = table.align?.[i] ?? 'l';
				return cells
					.map((cell) => cellToTex((cell.children[0] as Text)?.value ?? '', alignment))
					.join(' & ');
			})
			.join(' \\\\ \n');

		const texTable = `
\\begin{table}
\\centering
\\begin{tabular}{${'|' + 'l|'.repeat(numberOfColumns)}}
\\hline
${tableString}
\\end{tabular}
\\end{table}
`;

		// Replace the table with the new subtree
		const subtree = fromMarkdown(texTable);
		ast.children = [...subtree.children];
		ast.type = 'paragraph';

		return;
	}

	for (const child of children) {
		if ('children' in child) {
			convertMdTablesToTex(child);
		}
	}
}

function cellToTex(cell: string, align: string = 'l') {
	if (align.length > 1) {
		align = align[0];
	}

	const isMultiline = cell.includes('\n');

	if (isMultiline) {
		// format: \begin{tabular}[c]{@{}l@{}}line1\\ line2\end{tabular}
		// const lines = cell.split('\n');
		// const multilineCell = lines.map((line) => line.trim()).join('\\\\');
		// cell = `\\begin{tabular}[c]{@{}${align}@{}}${multilineCell}\\end{tabular}`;

		cell = cell.replace(/\n/g, '\\\\');
	}

	const isLeftAligned = align === 'l';
	if (isLeftAligned) {
		return cell;
	}

	return `\\multicolumn{1}{|${align}|}{${cell}}`;
}

export function convertTables(document: string) {
	const ast: Root = fromMarkdown(document, {
		extensions: [gfmTable()],
		mdastExtensions: [gfmTableFromMarkdown()]
	});

	convertMdTablesToTex(ast);

	const output = toMarkdown(ast);
	return output;
}

export async function storeAndReplaceDataImages(markdown: string, baseFolder: string) {
	// find all images in this format:
	// ![][image1]

	const imageRegex = /!\[\]\[(image\d+)\]/g;
	// const matches = markdown.matchAll(imageRegex);
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
		const image = `\\setkeys{Gin}{width=.5\\linewidth}\n![${id}](${path})`;

		await mkdir(join(baseFolder, 'images'), { recursive: true });
		const outputPath = join(baseFolder, path);
		await writeFile(outputPath, buffer);

		markdown = markdown.replace(imageDefinitionMatch[0], '').replace(match[0], image);
	}

	return markdown;
}
