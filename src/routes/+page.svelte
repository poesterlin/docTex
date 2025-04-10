<script lang="ts">
	import NewProject from './NewProject.svelte';
	import type { PageServerData } from './$types';
	import ProjectsList from './ProjectsList.svelte';
	import { IconPlus } from '@tabler/icons-svelte';

	let { data }: { data: PageServerData } = $props();

	let showNewProject = $state(false);

	function toggleNewProject() {
		showNewProject = !showNewProject;
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-4xl font-bold text-white">Projects</h1>
		<button
			onclick={toggleNewProject}
			class="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-700"
		>
			<IconPlus class="h-5 w-5" />
			New Project
		</button>
	</div>

	{#if showNewProject}
		<NewProject close={toggleNewProject} hasGoogleAuth={data.user.hasGoogleAuth} styles={data.styles} />
	{/if}

	<ProjectsList projects={data.projects} />
</div>

<style>
	h1 {
		view-transition-name: title;
	}
	button {
		view-transition-name: add-button;
	}
</style>
