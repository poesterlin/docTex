<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Style } from '$lib/server/db/schema';
	import { IconLoader } from '@tabler/icons-svelte';
	import { onMount } from 'svelte';

	let { close, hasGoogleAuth, styles }: { close: () => void; hasGoogleAuth: boolean; styles: Style[] } = $props();
	let el: HTMLDialogElement;

	let loading = $state(false);

	onMount(() => {
		if (el) {
			el.showModal();
		}
	});
</script>

<dialog
	bind:this={el}
	class="backdrop fixed inset-0 z-50 flex items-center justify-center rounded-xl border border-gray-700 bg-black bg-gray-800"
>
	<div class="w-full max-w-3xl p-8 shadow-xl">
		<h2 class="mb-6 text-2xl font-bold text-white underline">&#8544;. New Project</h2>

		<form
			action="?/setup"
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					close();
					await update();
				};
			}}
			class="space-y-6"
		>
			<div>
				<label for="projectName" class="mb-2 block text-sm font-medium text-gray-300"> Project Name </label>
				<input
					type="text"
					id="projectName"
					name="name"
					required
					class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
					placeholder="Enter project name"
				/>
			</div>

			<!-- Conditionally render the Google Drive sync option -->
			{#if hasGoogleAuth}
				<div class="flex items-start">
					<div class="flex h-5 items-center">
						<input
							id="syncDrive"
							name="createFolder"
							type="checkbox"
							class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
						/>
					</div>
					<div class="ml-3">
						<label for="syncDrive" class="text-sm font-medium text-gray-300"> Sync with Google Drive </label>
						<p class="text-sm text-gray-400">If enabled will also create a folder in your Google Drive with the same name.</p>
					</div>
				</div>
			{/if}

			<div>
				<label for="style" class="mb-2 block text-sm font-medium text-gray-300"> Select a style </label>
				<select
					id="style"
					name="styleId"
					required
					class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					<!-- Use a disabled selected option as a placeholder -->
					<option disabled selected value="">Select a style</option>
					{#each styles as style}
						<option value={style.id}>{style.name}</option>
					{/each}
				</select>
			</div>

			<div class="flex justify-end gap-4 pt-4">
				<button type="button" onclick={close} class="px-4 py-2 text-gray-300 transition-colors hover:text-white"> Cancel </button>
				<button
					type="submit"
					class="rounded-lg bg-pink-600 px-6 py-2 font-medium text-white transition-colors hover:bg-pink-700"
					disabled={loading}
				>
					{#if loading}
						<IconLoader class="h-5 w-5 animate-spin" />
					{:else}
						&#8545;. Setup
					{/if}
				</button>
			</div>
		</form>
	</div>
</dialog>
