<script lang="ts">
	import { handleSettingsSubmit } from '$lib/client/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function submit(event: Event) {
		const input = event.target as HTMLInputElement;
		const form = input.form as HTMLFormElement;
		handleSettingsSubmit(form);
	}
</script>

<h2 class="text-3xl font-semibold text-white">Setting</h2>

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
