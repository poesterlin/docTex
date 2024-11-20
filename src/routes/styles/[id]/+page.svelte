<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1 class="mb-4 text-3xl font-bold">
	{data.style.name}
</h1>

<form
	class="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow-md"
	use:enhance
	method="POST"
	action="?/addFile"
	enctype="multipart/form-data"
>
	<h2
        class="text-xl font-semibold"
    >Add File</h2>
	<!-- Name Field -->
	<div>
		<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
		<input
			required
			name="name"
			id="name"
			type="text"
			class="mt-1 block w-full rounded-md border border-gray-300 p-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
			class="mt-1 block w-full resize-none rounded-md border border-gray-300 p-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
			class="mt-1 block w-full rounded-md border border-gray-300 p-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
		/>
	</div>

    <div class="flex items-center justify-between">
        <label for="override" class="block text-sm font-medium text-gray-700 flex-1 py-4">
            Should the file be overridden? 
        </label>
        <input type="checkbox" name="override" id="override" class="mr-2" />
    </div>

	<!-- File Field -->
	<label
		for="file"
		class="block w-full rounded-md bg-sky-500 px-4 py-2 text-center font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	>
		Add Default File
	</label>
	<input id="file" type="file" class="hidden" name="file" required />


	<!-- Submit Button -->
	<button
		type="submit"
		class="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	>
		Submit
	</button>
</form>

<h2 class="mt-8">Files</h2>

<ul class="mt-8 space-y-3">
	{#each data.files as file}
		<li
			class="group block flex items-center justify-between rounded-lg bg-gray-100 p-3 font-medium shadow hover:bg-gray-200"
		>
			<div class="flex flex-col w-full items-center justify-between">
				<h4 class="text-indigo-600">
					{file.name}
				</h4>
				<p class="text-gray-500">
					{file.description}
				</p>
			</div>

			<!-- tags -->
			<div class="mt-2 flex flex-col w-full items-center justify-between text-sm text-gray-500">
				<span class="">{file.mimeType}</span>
				<span class="">{file.path}</span>
			</div>

			<form action="?/deleteFile" method="POST" use:enhance class="min-w-max">
				<input type="hidden" name="id" value={file.id} />
				<button
					type="submit"
					class="opacity-0 group-hover:opacity-100 rounded-md bg-red-500 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					Delete
				</button>
			</form>
		</li>
	{/each}
</ul>
