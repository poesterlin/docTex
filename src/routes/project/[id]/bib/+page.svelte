<script lang="ts">
	import { enhance } from '$app/forms';
	import type { BibReference } from '$lib/server/db/schema';
	import type { PageData } from './$types';
	import Citation from '$lib/client/Citation.svelte';
	import { IconX } from '@tabler/icons-svelte';

	let { data }: { data: PageData } = $props();
	let valid = $state<undefined | boolean>();
	let bibEntry = $state<undefined | BibReference>();
	let dialogEl: HTMLDialogElement;

	function validateBibEntry(e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
		const el = e.currentTarget;
		const match = el.value.match(/@\w+\{(?<key>[\w-]+),/);
		const key = match?.groups?.key;
		valid = Boolean(match && key);
	}

	function parseBib(bib: string) {
		const lines = bib.split('\n');

		const parsed = lines
			.map((line) => {
				if (!line.includes('=')) {
					return;
				}

				const [key, value] = line.split('=');
				return { key, value };
			})
			.filter((line) => line?.key && line?.value);

		const result = parsed
			.map((line) => {
				const key = replaceSpecialChars(line!.key.trim()).toUpperCase();
				const value = replaceSpecialChars(line!.value.trim());
				return `<b>${key}:</b> ${value}`;
			})
			.join('\n');

		return result;
	}

	function replaceSpecialChars(str: string) {
		return str.replace(/[\{\}]/g, '');
	}

	function open(bib: BibReference) {
		bibEntry = bib;
		dialogEl.showModal();
	}
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Files</h2>

<details open>
	<summary>Add a bibliography entry</summary>
	<form action="?/addBib" method="POST" class="space-y-4" use:enhance>
		<textarea
			oninput={(e) => validateBibEntry(e)}
			name="content"
			class="mt-2 block h-80 w-full rounded-md border border-gray-600 p-2 leading-6 tracking-widest text-gray-300 shadow"
			placeholder="Enter the bibliography entry here..."
		></textarea>
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

<ul class="mt-8 gap-4">
	{#each data.bibliography as bib}
		<li class="rounded-lg bg-gray-800 p-3 font-medium text-white shadow">
			<h3>{bib.key}</h3>
			<form action="?/delBib" method="POST" class="inline-block" use:enhance>
				<input type="hidden" name="id" value={bib.id} />
				<button type="submit" class="text-red-600 hover:text-red-400">Delete</button>
			</form>
			<button onclick={() => open(bib)} class="text-gray-300 hover:text-gray-600">Generate Citation</button>

			<div class="mt-8 text-gray-400">
				<pre>{@html parseBib(bib.content as string)}</pre>
			</div>
		</li>
	{:else}
		<li class="text-gray-400">This project does not include any bibliography entries yet.</li>
	{/each}
</ul>

<!-- Citation Generation Dialog -->
<dialog class="z-50 flex items-center justify-center rounded-xl shadow-lg" bind:this={dialogEl}>
	<form method="dialog">
		<button class="absolute right-0 top-0 p-4 text-gray-300 hover:text-gray-600" aria-label="Close" onclick={() => (bibEntry = undefined)}>
			<IconX class="h-6 w-6" />
		</button>
	</form>
	{#if bibEntry}
		<Citation {bibEntry} />
	{/if}
</dialog>

<style>
	ul {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		width: 100%;
		li {
			display: grid;
			grid-template-columns: subgrid;
			grid-column: span 3;
			align-items: center;
			justify-content: space-between;

			* {
				text-align: center;
			}

			:first-child {
				text-align: left;
				margin-left: 1rem;
			}

			div {
				grid-column: span 3;
			}

			pre {
				white-space: pre-wrap;
				word-wrap: break-word;
				line-height-step: 1.5rem;
			}
		}
	}

	dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
