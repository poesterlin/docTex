<script lang="ts">
	import { enhance } from '$app/forms';
	import { toastStore } from '$lib/client/toast.svelte';
	import type { BibReference } from '$lib/server/db/schema';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let valid = $state<undefined | boolean>();

	function validateBibEntry(e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
		const el = e.currentTarget;
		const match = el.value.match(/@\w+\{(?<key>\w+),/);
		const key = match?.groups?.key;
		valid = Boolean(match && key);
	}

	function copyCitationToClipboard(bib: BibReference) {
        // TODO: add feature to cite specific site
		const cite = `[@${bib.key}]`;
		navigator.clipboard.writeText(cite);
		toastStore.show('Citation copied to clipboard');
	}
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Files</h2>

<details open>
	<summary>Add a bibliography entry</summary>
	<form action="?/addBib" method="POST" class="space-y-4" use:enhance>
		<label>
			<span class="block text-gray-400">Entry</span>
			<textarea
				oninput={(e) => validateBibEntry(e)}
				name="content"
				class="block h-80 w-full rounded-md border border-gray-600 p-2 leading-6 tracking-widest text-gray-300 shadow"
				placeholder="Enter the bibliography entry here..."
			></textarea>
		</label>
		{#if valid === false}
			<p class="text-red-600">
				Please enter a valid bibliography entry. For more details, visit the <a
					href="https://www.bibtex.com/g/bibtex-format/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">BibTeX format guide</a
				>.
			</p>
		{/if}
		<button
			type="submit"
			class="block w-full rounded-md bg-gray-800 p-2 font-medium text-white shadow hover:bg-gray-700 disabled:opacity-50"
			disabled={!valid}>Add</button
		>
	</form>
</details>

<ul class="mt-8 space-y-4">
	{#each data.bibliography as bib}
		<li class="block flex items-center justify-between rounded-lg bg-gray-800 p-3 font-medium text-white shadow">
			<h3>{bib.key}</h3>
			<!-- <pre class="text-gray-400">
				{JSON.stringify(bib.content, null, 2)}
			</pre> -->
			<form action="?/delBib" method="POST" class="inline-block" use:enhance>
				<input type="hidden" name="id" value={bib.id} />
				<button type="submit" class="text-red-600 hover:text-red-400">Delete</button>
			</form>
			<button onclick={() => copyCitationToClipboard(bib)}
                class="text-gray-300 hover:text-gray-600">Copy citation to clipboard</button>
		</li>
	{:else}
		<li class="text-gray-400">This project does not include any bibliography entries yet.</li>
	{/each}
</ul>
