<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h2 class="sticky top-0 mb-8 text-3xl font-semibold text-white p-4 shadow bg-gray-700/25 rounded-md backdrop-blur-md">Files</h2>
<ul class="space-y-4">
	{#each data.files as file}
		<li class="block flex items-center justify-between rounded-lg bg-gray-800 p-3 font-medium text-white shadow hover:bg-gray-700">
			<span>
				{file.name}
			</span>

			<p class="text-gray-400">
				{file.description}
			</p>

			<form
				action="?/openGDFolder"
				method="POST"
				class="inline-block rounded border border-2 border-gray-600 px-4 text-gray-300 shadow hover:bg-gray-600 hover:text-white"
				use:enhance
			>
				<input type="hidden" name="fileId" value={file.id} />
				<button type="submit"> Show </button>
			</form>

			<form action="?/reset" class="inline-block" method="POST" use:enhance>
				<input type="hidden" name="fileId" value={file.id} />
				<button type="submit" class="text-red-600 hover:text-red-400"> Reset </button>
			</form>
		</li>
	{:else}
		<li class="text-gray-400">
			<a href="/styles/{data.project.styleId}" class="underline">This Style</a> does not include any files to customize.
		</li>
	{/each}
</ul>
