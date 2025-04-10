import { env } from '$env/dynamic/private';
import { assert } from '$lib';
import {
    FileState,
	GoogleGenAI,
	createPartFromUri,
	type Part
} from '@google/genai';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const modelName = 'models/gemini-2.0-flash';

export async function uploadFile(blob: Blob, name: string) {
	const file = await ai.files.upload({
		file: blob,
		config: {
			name,
            displayName: name,
		}
	});

	assert(file.name);

	// Wait for the file to be processed.
	let getFile = await ai.files.get({ name: file.name });
	while (getFile.state === FileState.PROCESSING) {
		getFile = await ai.files.get({ name: file.name });
		console.log(`current file status: ${getFile.state}`);
		console.log('File is still processing, retrying in 5 seconds');

		await new Promise((resolve) => {
			setTimeout(resolve, 500);
		});
	}

	if (file.state === FileState.FAILED) {
		throw new Error('File processing failed.');
	}

	return file;
}

export type GoogleFile = {
    id: string; // Name of the file
    uri: string; // URI of the file
    mimeType: string; // MIME type of the file (e.g., 'application/pdf')
};

export function filesToParts(files: GoogleFile[]) {
	const content: Array<string | Part> = [];

	files.forEach((file) => {
		if (file.uri && file.mimeType) {
			const fileContent = createPartFromUri(file.uri, file.mimeType);
			content.push(fileContent);
		} else {
			console.warn(`File ${file.id} is missing URI or mimeType. Skipping.`);
		}
	});

	return content;
}

export async function getAIResponse(message: string, files: GoogleFile[]) {
	const systemInstruction = `**Core Task:** Answer the user's question using *only* the information found in the provided documents.

**Output Requirements:**
1.  **Format:** Your *entire* response MUST be valid HTML. Start the response directly with an HTML tag (e.g., \`<p>\`, \`<h2>\`).
2.  **Allowed HTML Tags:** Only use the following basic HTML tags: \`<p>\`, \`<b>\`, \`<i>\`, \`<u>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, \`<h2>\`, \`<h3>\`, \`<h4>\`, \`<h5>\`.
3.  **Forbidden Elements:**
    *   Do NOT include \`<html>\`, \`<head>\`, or \`<body>\` tags.
    *   Do NOT use *any* Markdown syntax (e.g., \`*\`, \`_\`, \`#\`, \`\`\`).
    *   Do NOT wrap your response in Markdown code blocks (like \`\`\`html ... \`\`\` or similar). Your output must be *raw* HTML.
4.  **Source Citation:** When referencing information from a document, include the source file name using this exact structure: \`<file>fileName</file>\`. Replace \`fileName\` with the display name of the source document.

**Example Snippet of Desired Output:**
<h2>Key Findings</h2>
<p>The primary conclusion is that <b>efficiency increased</b>. <file>5iojuxv4sljkhv2xixvnx373.pdf</file></p>
<ul><li>Factor A was the main driver. <file>5ioasdfa4sljkhv2xixvnx373</file></li></ul>
`;
	const content: Array<string | Part> = [message, ...filesToParts(files)];

	try {
		const response = await ai.models.generateContentStream({
			model: modelName,
			contents: content,
			config: {
				systemInstruction,
			}
		});

        return response;
	} catch (error) {
		console.error('Error getting AI response:', error);
		throw error; // Re-throw the error for the caller to handle
	}
}
