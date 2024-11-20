import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { requiredFilesTable, stylesTable } from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { generateId, validateForm } from "$lib";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { uploadFile } from "$lib/server/s3";

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        return redirect(302, "/login");
    }

    const id = params.id as string;
    const [style] = await db.select().from(stylesTable).where(eq(stylesTable.id, id)).limit(1);

    if (!style) {
        return error(404, { message: "Style not found" });
    }

    const files = await db.select().from(requiredFilesTable).where(eq(requiredFilesTable.stylesId, id));
    return { style, files };
};

export const actions = {
    addFile: validateForm(
        z.object({
            name: z.string().min(3),
            description: z.string().min(3),
            path: z.string().min(3),
            file: z.instanceof(File),
            override: z.string().transform((v) => v === "on"),
        }),
        async ({ locals, params }, form) => {
            if (!locals.user) {
                return redirect(302, "/login");
            }

            const styleId = params.id;
            const id = generateId();

            // TODO: upload file to cloud storage
            uploadFile(id, form.file);

            await db.insert(requiredFilesTable).values({
                id,
                name: form.name,
                description: form.description,
                path: form.path,
                stylesId: styleId,
                mimeType: form.file.type,
                default: id,
                override: form.override ? 1 : 0,
            });

            redirect(303, `/styles/${styleId}`);
        }
    ),

    deleteFile: validateForm(
        z.object({
            id: z.string(),
        }),
        async ({ locals, params }, form) => {
            if (!locals.user) {
                return redirect(302, "/login");
            }

            const styleId = params.id;
            await db.delete(requiredFilesTable).where(eq(requiredFilesTable.id, form.id));

            redirect(303, `/styles/${styleId}`);
        }
    ),
};