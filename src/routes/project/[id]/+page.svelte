<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastStore } from '$lib/client/toast.svelte';
	import { handleSettingsSubmit } from '$lib/client/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const lastSuccessfulBuild = data.outputs.find((build) => build.fileId !== null);

	const intl = Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	});

	function format(timestamp: Date) {
		return intl.format(timestamp);
	}

	function submit(event: Event) {
		const input = event.target as HTMLInputElement;
		const form = input.form as HTMLFormElement;
		handleSettingsSubmit(form);
	}
</script>

<h1 class="mt-8 text-2xl font-semibold">{data.project.name}</h1>
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

{#if data.outputs}
	<details>
		<summary class="mt-8 text-lg font-semibold">Builds</summary>

		<ul class="mt-4 space-y-4">
			{#each data.outputs as build}
				<li class="flex flex-col gap-4 rounded-md bg-gray-800 p-4 text-white shadow">
					<em class="min-w-[30%] font-semibold text-gray-300">{format(build.timestamp)}</em>

					{#if build.running}
						<p class="animate-pulse text-indigo-400">Running...</p>
					{:else}
						{#if build.fileId}
							<a
								href="/builds/{build.id}"
								class="flex-1 rounded-md bg-gray-700 p-4 text-indigo-600 shadow hover:bg-gray-600"
								target="_blank"
								download="{data.project.name}-{build.id.substring(0, 4)}.pdf"
							>
								Download PDF
							</a>

							<a
								href="/builds/{build.id}"
								class="flex-1 rounded-md bg-gray-700 p-4 text-indigo-600 text-indigo-600 shadow hover:bg-gray-600"
								target="_blank"
							>
								Open PDF
							</a>
						{:else if build.errors}
							<pre class="flex-1 text-red-500">{build.errors}</pre>
						{/if}

						<!-- logs -->
						<details>
							<summary class="mb-2 text-indigo-600">Logs</summary>
							<pre
								class="max-h-[50svh] flex-1 overflow-y-scroll rounded-md bg-black p-4 text-gray-500">{build.logs}</pre>
						</details>
					{/if}
				</li>
			{/each}
		</ul>
	</details>
{/if}

<h2 class="mt-16 text-xl font-semibold text-white">Files to Customize</h2>
<ul class="mt-4 space-y-4">
	{#each data.files as file}
		<li
			class="block flex items-center justify-between rounded-lg bg-gray-800 p-3 font-medium text-white shadow hover:bg-gray-700"
		>
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
		<li class="text-gray-400">No files to customize</li>
	{/each}
</ul>

<h2 class="mt-16 text-xl font-semibold text-white">Settings to Customize</h2>
<ul class="mt-4 space-y-4">
	{#each data.settings as setting (setting.id)}
		<li class="flex items-center space-x-4 rounded-md bg-gray-800 p-4 text-white shadow">
			<em class="min-w-[30%] font-semibold text-gray-300">{setting.key}</em>
			<form
				action="?/update-setting"
				method="post"
				onsubmit={handleSettingsSubmit}
				class="flex flex-1 items-center space-x-2"
			>
				<input type="hidden" name="id" value={setting.id} />
				<input
					type="text"
					name="value"
					value={setting.value}
					placeholder="Value"
					class="flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					onblur={submit}
				/>
				<input
					type="text"
					name="comment"
					value={setting.comment}
					placeholder="Comment"
					class="flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					onblur={submit}
				/>
				<input type="submit" hidden />
			</form>
		</li>
	{:else}
		<li class="text-gray-400">No settings to customize</li>
	{/each}
</ul>

<form action="?/resetSettings" method="POST">
	<button
		type="submit"
		class="mt-8 rounded-md bg-slate-500 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
	>
		Reset Settings
	</button>
</form>

<form action="?/delete" method="POST">
	<button
		type="submit"
		class="mt-8 w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
	>
		Delete Project
	</button>
</form>
