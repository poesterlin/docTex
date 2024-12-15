<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { IconPlayerPlay, IconLink, IconExternalLink, IconTrash } from '@tabler/icons-svelte';

	let { data }: { data: PageData } = $props();

	const lastSuccessfulBuild = data.build;
</script>

<h1 class="text-2xl text-3xl font-bold font-semibold">Overview</h1>

<ul class="divide-y divide-gray-700">
	<form action="?/build" method="POST" use:enhance>
		<button type="submit" class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-700">
			<span>Build Project</span>
			<IconPlayerPlay />
		</button>
	</form>

	{#if lastSuccessfulBuild}
		<a class="flex items-center justify-between px-4 py-4 hover:bg-gray-700" href="/project/{data.project.id}/pdf" target="_blank">
			<span class="font-medium text-gray-100">Open Last Build</span>
			<IconLink />
		</a>
	{/if}

	<a class="flex items-center justify-between px-4 py-4 hover:bg-gray-700" href="/styles/{data.style.id}">
		<span class="font-medium text-gray-100">Style</span>
		<span class="italic text-gray-400">{data.style.name}</span>
		<IconLink />
	</a>

	<a
		class="flex items-center justify-between px-4 py-4 hover:bg-gray-700"
		href="https://drive.google.com/drive/folders/{data.project.folderId}"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="font-medium text-gray-100">Open Google Drive Folder</span>
		<IconExternalLink />
	</a>

	<form action="?/delete" method="POST">
		<button type="submit" class="flex w-full items-center justify-between px-4 py-4 hover:bg-red-800">
			<span>Delete Project</span>
			<IconTrash />
		</button>
	</form>
</ul>
