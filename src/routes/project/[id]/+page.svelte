<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const lastSuccessfulBuild = data.build;
</script>

<h1 class="text-3xl font-bold mt-8 text-2xl font-semibold">{data.project.name}</h1>
<nav class="mt-4 space-x-4">
	<a href="/styles/{data.style.id}" class="text-indigo-400">Style: {data.style.name}</a>
	<a
		href="https://drive.google.com/drive/folders/{data.project.folderId}"
		class="text-gray-300"
		target="_blank"
		rel="noopener noreferrer">Open Google Drive Folder</a
	>
</nav>

<form action="?/build" method="POST" use:enhance class="mt-8">
	<button
		type="submit"
		class="w-full rounded-md bg-gray-800 px-4 py-2 font-medium text-white shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
	>
		Build Project
	</button>
</form>

{#if lastSuccessfulBuild}
	<div class="mt-4 flex w-full justify-center">
		<a
			href="/project/{data.project.id}/pdf"
			class="inline-block rounded-md bg-gray-800 px-6 py-2 text-center font-medium text-white shadow ring-2 ring-gray-500 ring-offset-2 hover:bg-gray-700 focus:outline-none"
			target="_blank"
		>
			Open Build
		</a>
	</div>
{/if}

<form action="?/delete" method="POST">
	<button
		type="submit"
		class="mt-8 w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
	>
		Delete Project
	</button>
</form>
