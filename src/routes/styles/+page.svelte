<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<ul class="mt-8 space-y-3">
	{#each data.styles as style}
		<li>
			<a
				href="/styles/{style.id}"
				class="block rounded-lg bg-gray-100 p-3 font-medium text-indigo-600 shadow hover:bg-gray-200"
			>
				<span>{style.name}</span>
				<p class="text-sm text-gray-600">{style.description}</p>
			</a>
		</li>
	{/each}
</ul>

{#if data.user}
	<form
		action="?/setup"
		method="POST"
		use:enhance
		enctype="multipart/form-data"
		class="mx-auto mt-8 max-w-md space-y-4 rounded-lg border-2 border-gray-200 bg-white p-6 shadow-md"
	>
		<label for="name" class="block text-sm font-medium text-gray-700"> New Style: </label>
		<input
			type="text"
			name="name"
			id="name"
			class="my-4 block w-full rounded-md border-2 p-4 shadow-sm outline-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			placeholder="Style Name"
		/>

		<label for="description" class="block text-sm font-medium text-gray-700"> Description: </label>
		<textarea
			name="description"
			id="description"
			class="my-4 block w-full resize-none rounded-md border-2 p-4 shadow-sm outline-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			placeholder="Style Description"
		></textarea>

		<!-- File Field -->
		<label
			for="file"
			class="block w-full rounded-md bg-sky-500 px-4 py-2 text-center font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Add Main File
		</label>
		<input id="file" type="file" class="hidden" name="file" required accept=".tex" />

		<button
			type="submit"
			class="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Create Style
		</button>
	</form>
{/if}
