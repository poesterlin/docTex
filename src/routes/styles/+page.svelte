<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>


<form
	action="?/setup"
	method="POST"
	use:enhance
	class="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow-md"
>
	<label for="name" class="block text-sm font-medium text-gray-700"> New Style: </label>
	<input
		type="text"
		name="name"
		id="name"
		class="block w-full rounded-md border-gray-300 p-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
		placeholder="Style Name"
	/>

	<button
		type="submit"
		class="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	>
		Create Style
	</button>
</form>

<ul
    class="mt-8 space-y-3"
>
	{#each data.styles as style}
		<li>
			<a
				href="/styles/{style.id}"
				class="block rounded-lg bg-gray-100 p-3 font-medium text-indigo-600 shadow hover:bg-gray-200"
			>
				{style.name}
			</a>
		</li>
	{/each}
</ul>
