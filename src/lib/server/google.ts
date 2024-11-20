import { env } from '$env/dynamic/private';
import { google } from 'googleapis';
import type { Session } from './db/schema';

const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.meet.readonly",
    "https://www.googleapis.com/auth/drive.metadata",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.photos.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.appfolder",
    "https://www.googleapis.com/auth/drive.install",
];


export function getAuthClient(session?: Session) {
    const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.REDIRECT_URI ?? 'https://doc.oesterlin.dev/authorize'
    );

    if (session) {
        oauth2Client.setCredentials(sessionToCredentials(session));
    }

    return oauth2Client;
}

export function getAuthInfo() {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const oauth2Client = getAuthClient();
    const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'online',
        /** Pass in the scopes array defined above.
          * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true,
        // Include the state parameter to reduce the risk of CSRF attacks.
        state,
        // prevent replay attacks
        nonce
    });

    return { authorizationUrl, state };
}

export function getToken(code: string) {
    const oauth2Client = getAuthClient();
    return oauth2Client.getToken(code);
}

export function sessionToCredentials(session: Session) {
    return {
        access_token: session.sessionToken,
        expiry_date: session.expiresAt.getTime(),
        token_type: 'Bearer'
    }
}

export async function getUserInfo(session: Session) {
    const oauth2Client = getAuthClient(session);

    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
    });

    const { data } = await oauth2.userinfo.get({ auth: oauth2Client });
    return data;
}

export async function invalidateToken(session: Session) {
    try {
        const oauth2Client = getAuthClient(session);
        oauth2Client.revokeToken(session.sessionToken);
    } catch (e) {
        console.error(e);
    }
}