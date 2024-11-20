import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { stylesTable } from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { generateId, validateForm } from "$lib";
import { z } from "zod";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        return redirect(302, "/login");
    }

    const styles = await db.select().from(stylesTable);

    return { styles };
};

export const actions = {
    setup: validateForm(
        z.object({
            name: z.string().min(3),
        }),
        async ({ locals }, form) => {
            if (!locals.user) {
                return redirect(302, "/login");
            }

            const id = generateId();
            await db.insert(stylesTable).values({ id, name: form.name });
            return redirect(303, `/styles/${id}`);
        }
    ),
};