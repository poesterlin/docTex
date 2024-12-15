<script lang="ts">
	import { IconCancel, IconDownload, IconLink } from '@tabler/icons-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const intlDate = Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric'
	});

	const intlTime = Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: 'numeric'
	});

	function format(timestamp: Date, mode: 'date' | 'time') {
		if (mode === 'time') {
			return intlTime.format(timestamp);
		}

		return intlDate.format(timestamp);
	}
</script>

<h2 class="sticky top-0 mb-8 text-3xl font-semibold text-white p-4 shadow bg-gray-700/25 rounded-md backdrop-blur-md">Builds</h2>
<ul class="space-y-6 divide-y divide-gray-700">
	{#each data.outputs as build}
		<li class="flex flex-col gap-4 rounded-md bg-gray-800 p-4 text-white shadow">
			<div class="flex items-center justify-between border-b border-gray-700 p-4">
				<b class="font-semibold text-gray-400">{format(build.timestamp, 'date')}</b>
				<span class="text-gray-300">
					{format(build.timestamp, 'time')}
				</span>
			</div>

			{#if build.running}
				<div class="flex items-center justify-between pl-4">
					<p class="animate-pulse text-slate-400">Running...</p>

					<form action="/?cancel">
						<button type="submit" class="flex items-center justify-between gap-4 rounded-md p-4 hover:bg-red-800">
							<span>Cancel</span>
							<IconCancel />
						</button>
					</form>
				</div>
			{:else}
				{#if build.fileId}
					<a class="flex items-center justify-between rounded-md p-4 hover:bg-gray-700" href="/builds/{build.id}" target="_blank">
						<span class="font-medium text-gray-100">Download PDF</span>
						<IconDownload />
					</a>

					<a href="/builds/{build.id}" class="flex items-center justify-between rounded-md p-4 hover:bg-gray-700" target="_blank">
						<span>Open PDF</span>
						<IconLink />
					</a>
				{:else if build.errors}
					<pre class="flex-1 text-red-500">{build.errors}</pre>
				{:else}
					<p class="text-gray-400">No PDF generated</p>
				{/if}

				<!-- logs -->
				{#if build.logs}
					<details class="rounded-md bg-gray-700 p-4">
						<summary class="text-slate-400">Logs</summary>
						<pre class="mt-2 max-h-[50svh] flex-1 overflow-y-scroll rounded-md bg-black p-4 text-gray-500">{build.logs}</pre>
					</details>
				{/if}
			{/if}
		</li>
	{/each}
</ul>
