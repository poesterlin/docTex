<script lang="ts">
	import { IconCancel, IconDownload, IconLink, IconPlayerPlay } from '@tabler/icons-svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let builds = $state(data.outputs);

	onMount(() => {
		const build = builds[0];

		if (!build?.running) {
			return;
		}

		const id = setInterval(async () => {
			const req = await fetch(`/project/${data.project.id}/builds/${build.id}`);
			const updatedBuild = await req.json();
			builds[0] = updatedBuild;

			if (!updatedBuild.running) {
				clearInterval(id);
			}
		}, 3 * 1000);

		return () => clearInterval(id);
	});

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

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Builds</h2>

{#if !builds[0]?.running}
	<form action="/project/{data.project.id}?/build" method="post">
		<button
			type="submit"
			class="items center my-4 flex w-full justify-between gap-4 rounded-md bg-gray-500 p-4 text-white shadow hover:bg-gray-700"
		>
			<span>Start Build</span>
			<IconPlayerPlay />
		</button>
	</form>
{/if}

<ul class="space-y-6 divide-y divide-gray-700">
	{#each builds as build}
		<li class="flex flex-col gap-4 rounded-md bg-gray-800 p-4 text-white shadow">
			<div class="flex items-center justify-between border-b border-gray-700 p-4">
				<b class="font-semibold text-gray-400">{format(build.timestamp, 'date')}</b>
				<span class="text-gray-300">{build.wordCount} Words</span>
				<span class="text-gray-300">
					{format(build.timestamp, 'time')}
				</span>
			</div>

			<div class="flex items-center justify-between pl-4">
				{#if build.running}
					<p class="animate-pulse text-slate-400">Running...</p>

					<form action="?/cancel" method="post">
						<input type="hidden" name="buildId" value={build.id} />
						<button type="submit" class="flex items-center justify-between gap-4 rounded-md p-4 hover:bg-red-800">
							<span>Cancel</span>
							<IconCancel />
						</button>
					</form>
				{:else if build.fileId}
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
			</div>

			<!-- logs -->
			<details class="rounded-md bg-gray-700 p-4">
				<summary class="text-slate-400">Logs</summary>
				<pre class="mt-2 max-h-[50svh] flex-1 overflow-y-scroll rounded-md bg-black p-4 text-gray-500">{build.logs}</pre>
			</details>
		</li>
	{/each}
</ul>
