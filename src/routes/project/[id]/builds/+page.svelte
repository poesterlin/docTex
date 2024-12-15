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

<h2 class="text-3xl font-semibold text-white">Builds</h2>
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
