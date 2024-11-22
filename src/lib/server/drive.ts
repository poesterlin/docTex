import { google } from 'googleapis';
import type { RequiredFile, Session } from './db/schema';
import { getAuthClient } from './google';
import { downloadFile } from './s3';
import { env } from '$env/dynamic/private';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const drive = google.drive('v3');

export async function listFilesInFolder(session: Session, folderId: string) {
	const auth = getAuthClient(session);

	const { data } = await drive.files.list({
		auth,
		// pageSize: 100,
		fields: 'files(id, name, mimeType)',
		q: `'${folderId}' in parents and trashed = false`
	});

	const result: { id: string; name: string; mimeType: string; isFolder: boolean }[] = [];

	for (const file of data.files ?? []) {
		result.push({
			id: file.id!,
			name: file.name!,
			mimeType: file.mimeType!,
			isFolder: file.mimeType === 'application/vnd.google-apps.folder'
		});
	}

	return result;
}

export async function createOrGetFolder(session: Session, name: string, parent?: string) {
	const auth = getAuthClient(session);

	const exists = await drive.files.list({
		auth,
		q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed = false and '${parent}' in parents`
	});

	if (exists.data.files?.length && exists.data.files[0].id) {
		return exists.data.files[0].id;
	}

	const res = await drive.files.create({
		auth,
		requestBody: {
			name,
			mimeType: 'application/vnd.google-apps.folder',
			parents: parent ? [parent] : undefined
		},
		fields: 'id'
	});

	return res.data.id!;
}

export async function deleteFolder(session: Session, folderId: string) {
	const auth = getAuthClient(session);

	await drive.files.delete({
		auth,
		fileId: folderId
	});
}

export async function copyFileToProjectFolder(
	session: Session,
	file: RequiredFile,
	folderId: string
) {
	const auth = getAuthClient(session);
	const buffer = await downloadFile(file.id);

	const pathParts = file.path.split('/');
	const fileName = pathParts.pop()!;
	const subfolders = pathParts;

	let currentFolderId = folderId;

	for (const subfolder of subfolders) {
		currentFolderId = await createOrGetFolder(session, subfolder, currentFolderId);
	}

	const filesInFolder = await listFilesInFolder(session, currentFolderId);
	const existingFile = filesInFolder.find((f) => f.name === fileName);

	if (existingFile) {
		await drive.files.update({
			auth,
			media: {
				mimeType: file.mimeType,
				body: buffer
			},
			fileId: existingFile.id
		});

		return;
	}

	await drive.files.create({
		auth,
		requestBody: {
			name: fileName,
			parents: [currentFolderId]
		},
		media: {
			mimeType: file.mimeType,
			body: buffer
		}
	});
}

export async function downloadFolder(session: Session, folderId: string, path?: string) {
	if (!path) {
		path = env.TMP_DIR + '/' + folderId;
	}

	await mkdir(path, { recursive: true });

	const auth = getAuthClient(session);
	const files = await listFilesInFolder(session, folderId);

	for (const file of files) {
		const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
		let filePath = join(path, file.name);

		if (isFolder) {
			await downloadFolder(session, file.id, filePath);
			continue;
		}

		const isDocument = file.mimeType === 'application/vnd.google-apps.document';
		if (isDocument) {
			const url = `https://docs.google.com/document/u/0/export?format=md&id=${file.id}`;

			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${auth.credentials.access_token}`
				}
			});
			const buffer = await res.arrayBuffer();
			writeFile(filePath + '.md', Buffer.from(buffer));
			continue;
		}

		const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
			headers: {
				Authorization: `Bearer ${auth.credentials.access_token}`
			}
		});

		const buffer = await res.arrayBuffer();
		
		let extension = fileTypeToExtension[file.mimeType];
		if (!extension) {
			extension = file.mimeType.split('/')[1] ?? 'bin';

			// Some file types have a longer extension, e.g. 'application/vnd.google-apps.document'
			// Those can not be inferred from the mimeType
			if (extension.length > 4) {
				throw new Error(`Unknown file type: ${file.mimeType}`);
			} else {
				console.log(`Unknown file type: ${file.mimeType}`);
			}
		}

		const hasExtensionInFileName = filePath.endsWith(extension);
		if (!hasExtensionInFileName) {
			filePath += '.' + extension;
		}

		await writeFile(filePath, Buffer.from(buffer));
	}
}

const fileTypeToExtension: Record<string, string> = {
	'application/vnd.google-apps.document': 'docx',
	'application/vnd.google-apps.spreadsheet': 'xlsx',
	'application/vnd.google-apps.presentation': 'pptx',
	'application/vnd.google-apps.drawing': 'png',
	'application/vnd.google-apps.script': 'json',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/bmp': 'bmp',
	'image/tiff': 'tiff',
	'image/svg+xml': 'svg',
	'image/x-icon': 'ico',
	'image/png': 'png',
	'application/pdf': 'pdf',
	'application/zip': 'zip'
};
