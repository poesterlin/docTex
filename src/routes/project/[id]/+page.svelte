<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	import { enhance } from '$app/forms';
</script>

<h1 class="mt-8 text-2xl font-semibold">{data.project.name}</h1>
<nav class="mt-4 space-x-4">
	<a href="/styles/{data.style.id}" class="text-indigo-600">Style: {data.style.name}</a>
	<a
		href="https://drive.google.com/drive/folders/{data.project.folderId}"
		class="text-indigo-600"
		target="_blank"
		rel="noopener noreferrer">Open Google Drive Folder</a
	>
</nav>

<h2 class="mt-8 text-xl font-semibold">Files</h2>
<ul class="mt-4 space-y-3">
	{#each data.files as file}
		<li
			class="block rounded-lg bg-gray-100 p-3 font-medium text-indigo-600 shadow hover:bg-gray-200"
		>
			<span>
				{file.name}
			</span>

			<form action="?/reset" class="float-right inline-block" method="POST" use:enhance>
				<input type="hidden" name="fileId" value={file.id} />
				<button type="submit" class="float-right text-red-600"> Reset </button>
			</form>
		</li>
	{/each}
</ul>

<form action="?/build" method="POST" use:enhance>
	<button
		type="submit"
		class="mt-8 w-full rounded-md bg-sky-600 px-4 py-2 font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	>
		Build Project
	</button>
</form>
