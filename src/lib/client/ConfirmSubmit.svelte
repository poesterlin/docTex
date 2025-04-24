<script lang="ts">
	import type { Snippet } from 'svelte';
	import Modal from './Modal.svelte';
	import { assert, assertInstanceOf } from '$lib';

	type Props = {
		children: Snippet;
		class: string;
	};

	let { children, ...rest }: Props = $props();

	let openDialog = $state(false);

	function handleClick(event: MouseEvent) {
		event.preventDefault();
		openDialog = true;
	}

	function fireSubmit(event: MouseEvent) {
		const target = event.target;
		assert(target);
		console.log(target);
		assertInstanceOf(target, HTMLElement);
		target.closest('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
		openDialog = false;
	}
</script>

<button type="button" onclick={handleClick} {...rest}>
	{@render children()}
</button>

{#if openDialog}
	<Modal onClose={() => (openDialog = false)} cancelButton={false}>
		<h2 class="text-xl font-bold">Are you sure?</h2>
		<p class="mt-2">This action cannot be undone.</p>

		<div class="mt-4 flex justify-between">
			<button autofocus type="button" class="mr-2 rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800" onclick={() => (openDialog = false)}>
				Cancel
			</button>
			<button type="submit" class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 flex gap-2" onclick={fireSubmit}>
				{@render children()}
			</button>
		</div>
	</Modal>
{/if}
