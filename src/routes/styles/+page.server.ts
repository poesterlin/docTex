import { generateId, validateForm } from "$lib";
import { db } from "$lib/server/db";
import { styleSettingsTable, stylesTable } from "$lib/server/db/schema";
import { uploadFile } from "$lib/server/s3";
import { findAllSettings } from "$lib/server/tex.js";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

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
            file: z.instanceof(File),
        }),
        async ({ locals }, form) => {
            if (!locals.user) {
                return redirect(302, "/login");
            }

            const id = generateId();

            const content = await form.file.text();
            const settings = await findAllSettings(content);

            await uploadFile(id, form.file);
            await db.insert(stylesTable).values({ id, name: form.name, mainFile: id });

            for (const setting of settings) {
                await db.insert(styleSettingsTable).values({ id: generateId(), styleId: id, key: setting, value: "" });
            }

            return redirect(303, `/styles/${id}`);
        }
    ),
};