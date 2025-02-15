<script lang="ts">
	import { enhance } from '$app/forms';
	import Settings from '$lib/client/Settings.svelte';
	import { handleSettingsSubmit } from '$lib/client/utils';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	function submit(event: Event) {
		const input = event.target as HTMLInputElement;
		const form = input.form as HTMLFormElement;
		handleSettingsSubmit(form);
	}
</script>

<h1 class="mb-4 text-3xl font-bold">
	{data.style.name}
</h1>

<details class="mb-4">
	<summary class="cursor-pointer select-none text-lg text-indigo-600"> Edit Style</summary>
	<form
		class="mx-auto mt-8 max-w-md space-y-4 rounded-lg border-2 border-gray-700 bg-gray-800 p-6 text-white shadow-md"
		use:enhance
		method="POST"
		action="?/addFile"
		enctype="multipart/form-data"
	>
		<h2 class="text-xl font-semibold">Add File</h2>
		<!-- Name Field -->
		<div>
			<label for="name" class="block text-sm font-medium text-gray-300">Name</label>
			<input
				required
				name="name"
				id="name"
				type="text"
				class="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 p-4 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			/>
		</div>

		<!-- Description Field -->
		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				name="description"
				required
				cols="30"
				rows="10"
				id="description"
				class="mt-1 block w-full resize-none rounded-md border border-gray-600 bg-gray-700 p-4 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			></textarea>
		</div>

		<!-- Path Field -->
		<div>
			<label for="path" class="block text-sm font-medium text-gray-700">File Path</label>
			<input
				name="path"
				required
				id="path"
				type="text"
				class="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 p-4 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			/>
		</div>

		<div class="flex items-center justify-between">
			<label for="override" class="block flex-1 py-4 text-sm font-medium text-gray-300">
				Should the file be overridden by the project?
			</label>
			<input type="checkbox" name="override" id="override" class="mr-2" />
		</div>

		<!-- File Field -->
		<label
			for="file"
			class="block w-full rounded-md bg-gray-700 px-4 py-2 text-center font-medium text-white shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Add Default File
		</label>
		<input id="file" type="file" class="hidden" name="file" required />

		<!-- Submit Button -->
		<button
			type="submit"
			class="w-full rounded-md bg-gray-700 px-4 py-2 font-medium text-white shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Submit
		</button>
	</form>

	<form
		action="?/update-main"
		method="POST"
		enctype="multipart/form-data"
		class="mx-auto mt-8 max-w-md space-y-4 rounded-lg border-2 border-gray-700 bg-gray-800 p-6 text-white shadow-md"
		use:enhance
	>
		<h2 class="text-xl font-semibold">Update Main File</h2>
		<label
			for="main"
			class="block w-full rounded-md bg-gray-700 px-4 py-2 text-center font-medium text-white shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			New Main File
			<input id="main" type="file" name="file" class="hidden" required accept=".tex" />
		</label>

		<button
			type="submit"
			class="w-full rounded-md bg-gray-700 px-4 py-2 font-medium text-white shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Replace
		</button>
	</form>
</details>

{#await data.mainFilePromise}
	<p>Loading...</p>
{:then data}
	{#if data}
		<h2 class="mt-16 text-xl font-semibold">Main File</h2>
		<pre class="mt-4 whitespace-pre-wrap rounded-lg bg-gray-800 p-3 font-medium text-white shadow">{data}</pre>
	{:else}
		<p class="mt-16 text-gray-500">No main File found</p>
	{/if}
{/await}

<h2 class="mt-16 text-xl font-semibold">Files</h2>

<ul class="mt-4 space-y-3">
	{#each data.files as file}
		<li class="group block flex items-center justify-between rounded-lg bg-gray-800 p-3 font-medium text-white shadow hover:bg-gray-700">
			<div class="flex w-full flex-col items-center justify-between">
				<h4 class="text-gray-400">
					{file.name}
				</h4>
				<p class="text-gray-500">
					{file.description}
				</p>
			</div>

			<!-- tags -->
			<div class="mt-2 flex w-full flex-col items-center justify-between text-sm text-gray-400">
				<span class="">{file.mimeType}</span>
				<span class="">{file.path}</span>
			</div>

			<form action="?/deleteFile" method="POST" use:enhance class="min-w-max">
				<input type="hidden" name="id" value={file.id} />
				<button
					disabled={file.id === data.style.mainFile}
					type="submit"
					class="rounded-md bg-red-700 px-4 py-2 font-medium text-white opacity-0 shadow hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 group-hover:opacity-100"
				>
					Delete
				</button>
			</form>
		</li>
	{:else}
		<li class="text-gray-500">No files added</li>
	{/each}
</ul>

<h2 class="mt-16 text-xl font-semibold">Settings Defaults</h2>
<p>These are the default settings for this style. They can be overridden by the users project.</p>

<ul class="mt-4 space-y-4">
	{#each data.settings as setting (setting.id)}
		<li class="flex items-center space-x-4 rounded-md bg-gray-800 p-4 text-white shadow">
			<em class="min-w-[30%] font-semibold text-gray-300">{setting.key}</em>
			<form action="?/update-setting" method="post" onsubmit={handleSettingsSubmit} class="flex flex-1 items-center space-x-2">
				<input type="hidden" name="id" value={setting.id} />
				<Settings {setting} onsubmit={submit} />
				<input type="submit" hidden />
			</form>
		</li>
	{/each}
</ul>

<form action="?/delete" method="POST" use:enhance class="pb-32">
	<button
		type="submit"
		class="mt-8 w-full rounded-md bg-red-700 px-4 py-2 font-medium text-white shadow hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
	>
		Delete Style
	</button>
</form>
