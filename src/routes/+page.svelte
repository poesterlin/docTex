<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<form
	action="?/setup"
	method="POST"
	use:enhance
	class="mx-auto max-w-md rounded-lg border-2 border-gray-200 bg-white p-6 shadow-md"
>
	<label for="name" class="block text-sm font-medium text-gray-700"> New Project: </label>
	<input
		required
		type="text"
		name="name"
		id="name"
		class="my-4 block w-full rounded-md border-2 p-4 shadow-sm outline-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
		placeholder="Project Name"
	/>
	<p class="my-2 px-4 text-sm text-gray-500">
		This will also create a folder in your Google Drive with the same name.
	</p>
	<select
		required
		name="styleId"
		id="style"
		class="my-4 w-full rounded-md border-2 p-4 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
	>
		<option selected disabled>Select a style</option>
		{#each data.styles as style}
			<option value={style.id}>{style.name}</option>
		{/each}
	</select>

	<button
		type="submit"
		class="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	>
		Setup
	</button>
</form>

<h1 class="mt-8 text-2xl font-semibold">Projects</h1>
<ul class="mt-8 space-y-3">
	{#each data.projects as projects}
		<li>
			<a
				href="/project/{projects.id}"
				class="block rounded-lg bg-gray-100 p-3 font-medium text-indigo-600 shadow hover:bg-gray-200"
			>
				{projects.name}
			</a>
		</li>
	{:else}
		<li>No projects yet</li>
	{/each}
</ul>
