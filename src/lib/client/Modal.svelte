<script lang="ts">
	import { assert } from '$lib';
	import { IconX } from '@tabler/icons-svelte';
	import { onMount, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		children: Snippet;
		onClose: () => void;
		cancelButton?: boolean;
	}

	let dialog = $state<HTMLDialogElement>();

	let { children, onClose, cancelButton = true }: Props = $props();

	$effect(() => {
		assert(dialog);
		dialog.showModal();
	});

	function handleOutsideClick(event: MouseEvent) {
		if (event.target === dialog) {
			handleClose();
		}
	}

	function handleClose() {
		onClose();
	}

	function trapFocus(event: KeyboardEvent) {
		assert(dialog);
		const focusableElements = dialog.querySelectorAll(
			'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (event.target === lastElement && event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault();
			firstElement.focus();
		} else if (event.target === firstElement && event.key === 'Tab' && event.shiftKey) {
			event.preventDefault();
			lastElement.focus();
		}
	}
</script>

<dialog
	in:fade={{ duration: 200 }}
	class="glass relative m-auto max-h-[80vh] transform overflow-hidden overflow-y-auto rounded-xl border border-gray-700 !bg-black/90 p-6 text-left text-white shadow-xl transition-all sm:w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl"
	bind:this={dialog}
	onclick={handleOutsideClick}
	onkeydown={trapFocus}
>
	{#if cancelButton}
		<button
			autofocus
			class="absolute right-3 top-3 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
			onclick={handleClose}
		>
			<IconX></IconX>
		</button>
	{/if}

	{@render children()}
</dialog>

<style>
	dialog::backdrop {
		background-color: var(--color-backdrop, rgba(0, 0, 0, 0.2));
		opacity: 1;
		backdrop-filter: blur(3px);
	}
</style>
