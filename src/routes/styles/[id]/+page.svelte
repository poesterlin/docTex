<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1 class="mb-4 text-3xl font-bold">
	{data.style.name}
</h1>

<details class="mb-4">
	<summary class="text-indigo-600 cursor-pointer text-lg select-none">
		Edit Style</summary>
	<form
		class="mx-auto mb-6 max-w-md space-y-4 rounded-lg bg-white p-6 shadow-md"
		use:enhance
		method="POST"
		action="?/addFile"
		enctype="multipart/form-data"
	>
		<h2 class="text-xl font-semibold">Add File</h2>
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
			<label for="override" class="block flex-1 py-4 text-sm font-medium text-gray-700">
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

	<form
		action="?/update-main"
		method="POST"
		enctype="multipart/form-data"
		class="mx-auto mb-6 max-w-md space-y-4 rounded-lg bg-white p-6 shadow-md"
		use:enhance
	>
		<h2 class="text-xl font-semibold">Update Main File</h2>
		<label
			for="main"
			class="block w-full rounded-md bg-sky-500 px-4 py-2 text-center font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Upload Main File
			<input id="main" type="file" name="file" class="hidden" required accept=".tex" />
		</label>

		<button
			type="submit"
			class="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Replace
		</button>
	</form>
</details>
<h2 class="mt-16 text-xl font-semibold">Files</h2>

<ul class="mt-4 space-y-3">
	{#each data.files as file}
		<li
			class="group block flex items-center justify-between rounded-lg bg-gray-100 p-3 font-medium shadow hover:bg-gray-200"
		>
			<div class="flex w-full flex-col items-center justify-between">
				<h4 class="text-indigo-600">
					{file.name}
				</h4>
				<p class="text-gray-500">
					{file.description}
				</p>
			</div>

			<!-- tags -->
			<div class="mt-2 flex w-full flex-col items-center justify-between text-sm text-gray-500">
				<span class="">{file.mimeType}</span>
				<span class="">{file.path}</span>
			</div>

			<form action="?/deleteFile" method="POST" use:enhance class="min-w-max">
				<input type="hidden" name="id" value={file.id} />
				<button
					type="submit"
					class="rounded-md bg-red-500 px-4 py-2 font-medium text-white opacity-0 shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 group-hover:opacity-100"
				>
					Delete
				</button>
			</form>
		</li>
	{/each}
</ul>

<h2 class="mt-16 text-xl font-semibold">Settings Defaults</h2>
<p>These are the default settings for this style. They can be overridden by the users project.</p>

<ul class="mt-4 space-y-4">
	{#each data.settings as setting}
		<li class="flex items-center space-x-4 rounded-md bg-gray-100 p-4 shadow">
			<em class="min-w-[30%] font-semibold text-gray-700">{setting.key}</em>
			<form
				action="?/update-setting"
				method="post"
				use:enhance={({ formElement }) => {
					const scroll = window.scrollY;
					return async () => {
						const path = '/styles/{data.style.id}';
						await invalidate(path);
						window.scrollTo(0, scroll);
						// @ts-ignore
						formElement.firstChild?.focus();

						// TODO: add a toast message that the setting was updated
					};
				}}
				class="flex flex-1 items-center space-x-2"
			>
				<input type="hidden" name="id" value={setting.id} />
				<input
					type="text"
					name="value"
					value={setting.value}
					placeholder="Value"
					class="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					type="text"
					name="comment"
					value={setting.comment}
					placeholder="Comment"
					class="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input type="submit" hidden />
			</form>
		</li>
	{/each}
</ul>
