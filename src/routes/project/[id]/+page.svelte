<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
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

<form action="?/build" method="POST" use:enhance class="mt-8">
	<button
		type="submit"
		class="w-full rounded-md bg-sky-600 px-4 py-2 font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	>
		Build Project
	</button>
</form>

<h2 class="mt-16 text-xl font-semibold">Files to Customize</h2>
<ul class="mt-4 space-y-4">
	{#each data.files as file}
		<li
			class="block rounded-lg bg-gray-100 p-3 font-medium text-indigo-600 shadow hover:bg-gray-200 flex items-center justify-between"
		>
			<span>
				{file.name}
			</span>

			<p class="text-gray-500">
				{file.description}
			</p>

			<form action="?/openGDFolder" method="POST" class="inline-block border text-indigo-600 border-2 border-indigo-600 px-4 rounded shadow hover:bg-indigo-600 hover:text-white" use:enhance>
				<input type="hidden" name="fileId" value={file.id} />
				<button type="submit"> Show </button>
			</form>

			<form action="?/reset" class="inline-block" method="POST" use:enhance>
				<input type="hidden" name="fileId" value={file.id} />
				<button type="submit" class="text-red-600"> Reset </button>
			</form>
		</li>
	{/each}
</ul>

<h2 class="mt-16 text-xl font-semibold">Settings to Customize</h2>
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
						const path = `/project/[id]`;
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
