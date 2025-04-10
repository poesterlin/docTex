<script lang="ts">
	import NewStyle from './NewStyle.svelte';
	import type { PageServerData } from './$types';
	import { IconPlus } from '@tabler/icons-svelte';

	let { data }: { data: PageServerData } = $props();

	let showNewProject = $state(false);

	function toggleNewProject() {
		showNewProject = !showNewProject;
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-4xl font-bold text-white">Styles</h1>
		<button
			onclick={toggleNewProject}
			class="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-700"
		>
			<IconPlus class="h-5 w-5" />
			New Style
		</button>
	</div>

	{#if showNewProject && data.user}
		<NewStyle close={toggleNewProject} />
	{/if}

	<div class="grid gap-4">
		{#each data.styles as style}
			<a
				href="/styles/{style.id}"
				class="hover:bg-gray-750 block rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600"
			>
				<div class="flex flex-col">
					<h3 class="text-xl font-bold text-white">{style.name}</h3>
					<span class="text-sm text-gray-400">{style.description}</span>
				</div>
				<!-- <div class="mt-2 flex items-center gap-2">
					<span class="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-800">
						{style.}
					</span>
				</div> -->
			</a>
		{:else}
			<p class="text-gray-400">No projects yet.</p>
		{/each}
	</div>
</div>

<style>
	h1 {
		view-transition-name: title;
	}

	button {
		view-transition-name: add-button;
	}
</style>
