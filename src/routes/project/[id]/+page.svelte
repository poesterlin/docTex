<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { IconPlayerPlay, IconLink, IconExternalLink, IconTrash, IconCancel } from '@tabler/icons-svelte';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Overview</h1>

<ul class="divide-y divide-gray-700 rounded-md overflow-hidden bg-gray-800 shadow">
	<form action="?/build" method="POST" use:enhance>
		<button type="submit" class="flex w-full items-center justify-between p-4 hover:bg-gray-700">
			<span>Build Project</span>
			{#if data.build && data.build.running}
				<IconCancel />
			{:else}
				<IconPlayerPlay />
			{/if}
		</button>
	</form>

	{#if data.build}
		<a class="flex items-center justify-between p-4 hover:bg-gray-700" href="/project/{data.project.id}/pdf" target="_blank">
			<span class="font-medium text-gray-100">Open Last Build</span>
			<IconLink />
		</a>
	{/if}

	<a class="flex items-center justify-between p-4 hover:bg-gray-700" href="/styles/{data.style.id}">
		<span class="font-medium text-gray-100">Show Style</span>
		<IconLink />
	</a>

	<a
		class="flex items-center justify-between p-4 hover:bg-gray-700"
		href="https://drive.google.com/drive/folders/{data.project.folderId}"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="font-medium text-gray-100">Open Google Drive Folder</span>
		<IconExternalLink />
	</a>

	<form action="?/delete" method="POST">
		<button type="submit" class="flex w-full items-center justify-between p-4 hover:bg-red-800">
			<span>Delete Project</span>
			<IconTrash />
		</button>
	</form>
</ul>

<!-- <iframe src="/project/{data.project.id}/pdf" frameborder="0" class="mt-8 w-full h-40 md:h-96">
</iframe> -->