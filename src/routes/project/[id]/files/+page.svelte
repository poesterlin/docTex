<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Files</h2>
<ul class="space-y-4">
	{#each data.files as file}
		<li class="block flex items-center justify-between rounded-lg bg-gray-800 p-3 font-medium text-white shadow">
			<span>
				{file.name}
			</span>

			<p class="text-gray-400">
				{file.description}
			</p>

			{#if data.project.driveFolderId}
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
			{/if}
		</li>
	{:else}
		<li class="text-gray-400">
			<a href="/styles/{data.project.styleId}" class="underline">This Style</a> does not include any files to customize.
		</li>
	{/each}
</ul>

<style>
	h2 {
		view-transition-name: section;
	}
</style>
