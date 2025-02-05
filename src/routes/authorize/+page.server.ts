import { assert, generateId } from "$lib";
import { generateSessionToken, setSessionTokenCookie } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { sessionTable, userTable } from "$lib/server/db/schema";
import { getToken, getUserInfo } from "$lib/server/google";
import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const { url, cookies } = event;
    const code = url.searchParams.get('code');
    assert(code);

    const state = cookies.get('state', { decode: decodeURIComponent });
    assert(state);

    if (state !== decodeURIComponent(url.searchParams.get('state') ?? "")) {
        throw new Error('State mismatch');
    }

    const { tokens } = await getToken(code);
    const token = tokens.access_token;
    assert(token);

    const sessionToken = generateSessionToken();
    const expirationDate = new Date(tokens.expiry_date ?? Date.now() + 1000 * 60 * 60); 

    const userId = generateId();
    const session = {
        id: sessionToken,
        userId,
        expiresAt: expirationDate,
        sessionToken: token,
        isGoogleAuth: true
    };

    const data = await getUserInfo(session);
    const email = data.email;
    assert(email);
    const username = data.name;
    assert(username);

    let [user] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);

    if (!user) {
        [user] = await db
            .insert(userTable)
            .values({ id: userId, username, email })
            .returning();
    }
    session.userId = user.id;

    await db
        .insert(sessionTable)
        .values(session);

    setSessionTokenCookie(event, sessionToken, expirationDate);
    redirect(302, '/');
};
