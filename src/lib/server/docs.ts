import { drive } from 'googleapis/build/src/apis/drive';
import type { Session } from './db/schema';
import { getAuthClient } from './google';
import { docs } from '@googleapis/docs';

export async function createDocInFolder(session: Session, folderId: string, name: string) {
	const auth = getAuthClient(session);
	const docsSession = docs({ version: 'v1', auth });
	const driveSession = drive({ version: 'v3', auth });

	const document = await docsSession.documents.create({
		requestBody: {
			title: name
		}
	});

	const documentId = document.data.documentId;

	if (!documentId) {
		throw new Error('Failed to create document.');
	}

	console.log(`Created document with ID: ${documentId}`);

	// 2. Insert Content
	const requests = [
		{
			insertText: {
				location: { index: 1 },
				text: 'Hello, world!\n'
			}
		}
	];

	await docsSession.documents.batchUpdate({
		documentId,
		requestBody: { requests }
	});

	// const file = await driveSession.files.get({
	// 	fileId: documentId,
	// 	fields: 'parents'
	// });
	// const previousParents = file.data.parents || [];

	// Add the new parent folder.
	await driveSession.files.update({
		fileId: documentId,
		addParents: folderId,
		// removeParents: previousParents.join(','), // Join array to comma separated string
		fields: 'id, parents'
	});

	return document.data;
}
