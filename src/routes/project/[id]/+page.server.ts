import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { projectTable, requiredFilesTable, stylesTable } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        return redirect(302, '/login');
    }

    const id = params.id;
    const [project] = await db.select()
        .from(projectTable)
        .where(eq(projectTable.id, id))
        .limit(1);

    if (!project) {
        return error(404, 'Project not found');
    }

    const [style] = await db.select()
        .from(stylesTable)
        .where(eq(stylesTable.id, project.styleId))
        .limit(1);

    const files = await db.select()
        .from(requiredFilesTable)
        .where(and(
            eq(requiredFilesTable.stylesId, project.styleId),
            eq(requiredFilesTable.override, 1)
        ));

    return { project, style, files };
};