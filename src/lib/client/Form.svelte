<script lang="ts" generics="T extends ActionResult">
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet<[boolean]>;
		action: string;
		onData?: (result: T) => void;
		onSubmit?: () => void;
		class?: string;
	}

	let loading = $state(false);
	let { children, action, onData,  onSubmit, ...rest }: Props = $props();
</script>

<form
	{action}
	method="POST"
	enctype="multipart/form-data"
	{...rest}
	use:enhance={() => {
		loading = true;
		onSubmit?.();
		return async ({ update, result }) => {
			loading = false;
			onData?.(result as T);
			await update();
		};
	}}
>
	{@render children(loading)}
</form>
