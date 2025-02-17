import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import { toastStore } from './toast.svelte';

export async function submitWithToast(form: HTMLFormElement | SubmitEvent, message?: string) {
	if (form instanceof Event) {
		form.preventDefault();
		form = form.target as HTMLFormElement;
	}

	const data = new FormData(form);

	const response = await fetch(form.action, {
		method: 'POST',
		body: data
	});

	/** @type {import('@sveltejs/kit').ActionResult} */
	const result = deserialize(await response.text());

	if (result.type === 'success') {
		toastStore.show(message ?? 'Settings updated');
	} else {
		invalidateAll();
	}
}
