import { google } from "googleapis";
import { getAuthClient } from "./google";
import type { Session } from "./db/schema";

const drive = google.drive('v3');

export async function listFilesInFolder(session: Session, folderId: string) {
    const oauth2Client = getAuthClient(session);

    const { data } = await drive.files.list({
        auth: oauth2Client,
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, parents)',
        q: `'${folderId}' in parents and trashed = false`
    });

    return data.files as { id: string, name: string }[];
}

export async function createFolder(session: Session, name: string) {
    const oauth2Client = getAuthClient(session);

    const res = await drive.files.create({
        auth: oauth2Client,
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id'
    });

    return res.data.id;
}

export async function deleteFolder(session: Session, folderId: string) {
    const oauth2Client = getAuthClient(session);

    await drive.files.delete({
        auth: oauth2Client,
        fileId: folderId
    });
}