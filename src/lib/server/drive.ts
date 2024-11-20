import { google } from "googleapis";
import { getAuthClient } from "./google";
import type { RequiredFile, Session } from "./db/schema";
import { downloadFileTo } from "./s3";
import { env } from "$env/dynamic/private";
import { join } from "node:path";

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

export async function createOrGetFolder(session: Session, name: string, parent?: string) {
    const oauth2Client = getAuthClient(session);

    const exists = await drive.files.list({
        auth: oauth2Client,
        q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed = false`
    });

    if (exists.data.files?.length && exists.data.files[0].id) {
        return exists.data.files[0].id;
    }

    const res = await drive.files.create({
        auth: oauth2Client,
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
    const oauth2Client = getAuthClient(session);

    await drive.files.delete({
        auth: oauth2Client,
        fileId: folderId
    });
}

export async function copyFileToProjectFolder(session: Session, file: RequiredFile, folderId: string) {
    const path = join(env.TMP_DIR, file.id);
    await downloadFileTo(file.id, path);

    const oauth2Client = getAuthClient(session);

    const filesInFolder = await listFilesInFolder(session, folderId);

    const pathParts = file.path.split('/');
    const subfolders = pathParts.slice(0, pathParts.length - 1);

    let currentFolderId = folderId;

    for (const subfolder of subfolders) {
        currentFolderId = await createOrGetFolder(session, subfolder, currentFolderId);
    }

    const existingFile = filesInFolder.find(f => f.name === file.path);

    if (existingFile) {
        await drive.files.update({
            auth: oauth2Client,
            requestBody: {
                name: file.path,
                parents: [folderId]
            },
            media: {
                mimeType: file.mimeType,
                body: path
            }
        });

        return;
    }

    await drive.files.create({
        auth: oauth2Client,
        requestBody: {
            name: file.path,
            parents: [folderId]
        },
        media: {
            mimeType: file.mimeType,
            body: path
        }
    });
}