<script lang="ts">
	import Checkbox from './checkbox.svelte';

	let {
		onsubmit,
		setting
	}: {
		onsubmit: (event: Event) => void;
		setting: {
			id: string | null; // TODO: fix type
			key: string;
			value: string | null; // TODO: fix type
			comment: string;
			isBoolean: boolean;
		};
	} = $props();
</script>

{#if setting.isBoolean}
	<div class="flex w-1/3 items-center space-x-4">
		<input
			type="checkbox"
			name="value"
			checked={!!setting.value}
			class="m-auto rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
			oninput={onsubmit}
            onchange={onsubmit}
            onblur={onsubmit}
		/>
	</div>
{:else}
	<input
		type="text"
		name="value"
		value={setting.value}
		placeholder="Value"
		class="flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
		onblur={onsubmit}
	/>
{/if}
<input
	type="text"
	name="comment"
	value={setting.comment}
	placeholder="Comment"
	class="flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
	onblur={onsubmit}
/>
