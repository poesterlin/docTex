<script lang="ts">
	import { enhance } from '$app/forms';
	import { IconX } from '@tabler/icons-svelte';
	import { onMount } from 'svelte';

	let { close }: { close: () => void } = $props();
	let el: HTMLDialogElement;

	onMount(() => {
		if (el) {
			el.showModal();
		}
	});
</script>

<dialog
	bind:this={el}
	class="backdrop fixed inset-0 z-50 flex w-[34rem] items-center justify-center rounded-xl border border-gray-700 bg-black bg-gray-800"
>
	<div class="w-full max-w-4xl p-8 shadow-xl">
		<!-- Header with Title and Close Button -->
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-bold text-white underline">&#8544;. New Style</h2>
			<button
				type="button"
				onclick={close}
				class="rounded-full p-1 text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
				aria-label="Close"
			>
				<!-- Simple 'X' icon -->
				<IconX class="h-6 w-6" />
			</button>
		</div>

		<!-- Form -->
		<form
			action="?/setup"
			method="POST"
			use:enhance={() => {
				return async ({ update }) => {
					close(); // Close dialog on successful enhancement
					await update();
				};
			}}
			enctype="multipart/form-data"
			class="space-y-6"
		>
			<!-- Name Input -->
			<div>
				<label for="name" class="mb-2 block text-sm font-medium text-gray-300"> New Style Name: </label>
				<input
					type="text"
					name="name"
					id="name"
					required
					class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
					placeholder="Enter style name"
				/>
			</div>

			<!-- Description Textarea -->
			<div>
				<label for="description" class="mb-2 block text-sm font-medium text-gray-300"> Description: </label>
				<textarea
					name="description"
					id="description"
					rows="3"
					required
					class="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
					placeholder="Style Description"
				></textarea>
			</div>

			<!-- File Input -->
			<div>
				<label for="file" class="mb-2 block text-sm font-medium text-gray-300"> Style File: </label>
				<label
					for="file"
					class="block w-full cursor-pointer rounded-lg border border-dashed border-gray-600 bg-gray-700 px-4 py-3 text-center text-sm text-gray-400 transition-colors hover:border-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					Click to upload .zip or .tex file
				</label>
				<input id="file" type="file" class="hidden" name="file" required accept=".zip,.tex" />
				<!-- Optional: Add element here to display selected filename -->
			</div>

			<!-- Action Buttons -->
			<div class="flex justify-end gap-4 pt-4">
				<button
					type="button"
					onclick={close}
					class="rounded-lg px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-800"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="rounded-lg bg-pink-600 px-6 py-2 font-medium text-white transition-colors hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-800"
				>
					&#8545;. Create Style
				</button>
			</div>
		</form>
	</div>
</dialog>
