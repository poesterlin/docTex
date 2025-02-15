<script lang="ts">
	import Settings from '$lib/client/Settings.svelte';
	import { handleSettingsSubmit } from '$lib/client/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function submit(event: Event) {
		const input = event.target as HTMLInputElement;
		const form = input.form as HTMLFormElement;
		handleSettingsSubmit(form);
	}
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Setting</h2>

<ul class="space-y-4">
	{#each data.settings as setting (setting.id)}
		<li class="flex items-center space-x-4 rounded-md bg-gray-800 p-4 text-white shadow">
			<span class="min-w-[30%] font-semibold text-gray-300">{setting.key}</span>
			<form action="?/update-setting" method="post" onsubmit={handleSettingsSubmit} class="flex flex-1 items-center space-x-2">
				<input type="hidden" name="id" value={setting.id} />
				<Settings {setting} onsubmit={submit} />
				<input type="submit" hidden />
			</form>
		</li>
	{:else}
		<li class="text-gray-400">
			<a href="/styles/{data.project.styleId}" class="underline">This Style</a> does not have any settings to customize.
		</li>
	{/each}
</ul>

{#if data.settings.length > 0}
	<form action="?/resetSettings" method="POST">
		<button
			type="submit"
			class="mt-8 rounded-md bg-slate-500 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
		>
			Reset Settings
		</button>
	</form>
{/if}
