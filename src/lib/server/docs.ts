import { drive } from 'googleapis/build/src/apis/drive';
import type { Session } from './db/schema';
import { getAuthClient } from './google';
import { docs } from '@googleapis/docs';

export async function createDocInFolder(session: Session, folderId: string, name: string) {
	const auth = getAuthClient(session);
	const docsSession = docs({ version: 'v1', auth });
	const driveSession = drive({ version: 'v3', auth });

	// 1. Create Document
	const document = await docsSession.documents.create({
		requestBody: {
			title: name
		}
	});

	const documentId = document.data.documentId;

	if (!documentId) {
		throw new Error('Failed to create document.');
	}

	// 2. Insert Content
	const requests = [
		{
			insertText: {
				location: { index: 1 },
				text: 'Hello, world!\n' // TODO: style this as a heading
			}
		}
	];

	await docsSession.documents.batchUpdate({
		documentId,
		requestBody: { requests }
	});

	// 3. set parent folder.
	await driveSession.files.update({
		fileId: documentId,
		addParents: folderId,
		fields: 'id, parents'
	});

	return document.data;
}
