// place files you want to import through the `$lib` alias in this folder.

import { encodeBase32LowerCase } from "@oslojs/encoding";
import { fail, type RequestEvent } from "@sveltejs/kit";
import type { z, ZodObject } from "zod";

export function assert<T>(p: T | undefined | null): asserts p is T {
    if (!p) {
        throw new Error('Assertion failed');
    }
}

export function generateId() {
    // ID with 120 bits of entropy, or about the same as UUID v4.
    const bytes = crypto.getRandomValues(new Uint8Array(15));
    const id = encodeBase32LowerCase(bytes);
    return id;
}

export type MaybePromise<T> = T | Promise<T>;
export type FormAction<
    T,
    Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
    OutputData extends Record<string, any> | void = Record<string, any> | void,
    RouteId extends string | null = string | null,
> = (event: RequestEvent<Params, RouteId>, form: T) => MaybePromise<OutputData>;

export function validateForm<T extends ZodObject<any>, Form extends z.infer<T>>(validator: T, action: FormAction<Form>) {
    return async function (event: any) {
        const form = await event.request.formData();

        const data = Object.fromEntries(form);
        const result = validator.safeParse(data);

        if (result.success === false) {
            return fail(400, { errors: result.error.errors, message: 'Invalid form data' });
        }

        return action(event, result.data as Form);
    }
}