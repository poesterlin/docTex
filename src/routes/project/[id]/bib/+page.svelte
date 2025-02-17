<script lang="ts">
	import { enhance } from '$app/forms';
	import type { BibReference } from '$lib/server/db/schema';
	import type { PageData } from './$types';
	import Citation from '$lib/client/Citation.svelte';
	import { IconDownload, IconExternalLink, IconFile, IconLink, IconNote, IconUpload, IconX } from '@tabler/icons-svelte';
	import { submitWithToast } from '$lib/client/utils';

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
				return `<b>${key}:</b> <span class="limit">${value}</span>`;
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

	function close() {
		dialogEl.close();
		bibEntry = undefined;
	}

	function saveNotes(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		const form = target.closest('form');

		if (!form) return;

		submitWithToast(form, 'Notes saved');
	}
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Files</h2>

<details open>
	<summary>Add a bibliography entry</summary>
	<form action="?/addBib" method="POST" class="mb-32 mt-4 space-y-5" use:enhance>
		<textarea
			oninput={(e) => validateBibEntry(e)}
			name="content"
			class="mt-2 block h-80 w-full rounded-md border border-gray-600 p-2 leading-6 tracking-widest shadow"
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

		<!-- url -->
		<label class="block">
			<span class="">URL</span>
			<input
				type="url"
				name="url"
				class="mt-2 block w-full rounded-md border border-gray-600 p-2 shadow"
				placeholder="Where did you find this?"
			/>
		</label>

		<!-- notes -->
		<label class="block">
			<span class="">Notes</span>
			<textarea
				name="notes"
				class="mt-2 block h-32 w-full rounded-md border border-gray-600 p-2 shadow"
				placeholder="Enter any notes here..."
			></textarea>
		</label>

		<button
			type="submit"
			class="block w-full rounded-md bg-gray-800 p-2 font-medium text-white shadow hover:bg-gray-700 disabled:opacity-50"
			disabled={!valid}>Add</button
		>
	</form>
</details>

<ul class="mt-8 gap-8">
	{#each data.bibliography as bib (bib.id)}
		<li class="gap-4 rounded-lg bg-gray-800 p-4 font-medium text-white shadow">
			<h3 class="ml-1 mt-1 text-xl uppercase">
				{bib.key}
			</h3>

			<div class="grid-span-2 flex items-center justify-end gap-2">
				<!-- TODO: find a way to add or update the url -->
				{#if bib.url}
					<a
						href={bib.url}
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-md bg-gray-700 p-2 text-center underline hover:bg-gray-900 hover:text-gray-100"
						title="View source"
					>
						<IconExternalLink />
					</a>
					<!-- spacer -->
					<div class="h-8 w-[1px] bg-gray-700"></div>
				{/if}
				<button onclick={() => open(bib)} class="rounded-md bg-gray-700 p-2 px-4 hover:bg-gray-900 hover:text-gray-100"
					>Generate Citation</button
				>
			</div>

			<details class="full-width border-t border-white pt-4 text-gray-400" open>
				<summary class="text-gray-400">Details</summary>
				<pre class="mt-2 max-h-[35svh] overflow-y-auto rounded-md bg-black p-4 text-gray-500">{@html parseBib(
						bib.content as string
					)}</pre>
			</details>

			<form action="?/update-note" class="full-width" use:enhance onsubmit={(f) => submitWithToast(f, 'Notes saved')}>
				<label class="ml-1 mt-4 flex items-center gap-2">
					Notes <IconNote class="h-4 w-4 text-gray-400" />
				</label>

				<input type="hidden" name="id" value={bib.id} />

				<textarea
					name="notes"
					class="notes mt-2 min-h-20 w-full flex-1 rounded-md border border-gray-700 p-2 px-4 text-gray-400 text-white"
					onblur={saveNotes}>{bib.notes}</textarea
				>
			</form>

			<form action="?/delBib" method="POST" class="full-width inline-block text-center" use:enhance>
				<input type="hidden" name="id" value={bib.id} />
				<button type="submit" class="text-center text-red-600 hover:text-red-400">Delete</button>
			</form>
		</li>
	{:else}
		<li class="text-gray-400">This project does not include any bibliography entries yet.</li>
	{/each}
</ul>

<div class="mt-8 flex flex-wrap justify-between gap-4">
	<a
		href="/project/{data.project.id}/bib/export"
		class="flex w-max gap-4 rounded-md bg-gray-800 p-4 px-6 font-medium text-white shadow hover:bg-gray-700"
		download="Bibliography.bib"
	>
		Download Bibliography
		<IconDownload />
	</a>

	<form
		action="?/import"
		method="POST"
		enctype="multipart/form-data"
		class="flex w-max overflow-hidden rounded-lg font-medium text-white shadow"
	>
		<label for="import" class="flex cursor-pointer items-center gap-2 bg-gray-800 p-4 hover:bg-gray-700">
			<IconFile />
			Import Bibliography
		</label>

		<input type="file" id="import" name="bib" accept=".bib" class="mt-8 hidden" required />
		<button type="submit" class="flex-1 border-l border-gray-700 bg-gray-800 px-4 hover:bg-gray-700">
			<IconUpload></IconUpload>
		</button>
	</form>
</div>
<!-- Citation Generation Dialog -->
<dialog class="z-50 flex items-center justify-center rounded-xl shadow-lg" bind:this={dialogEl}>
	{#if bibEntry}
		<form method="dialog">
			<button class="absolute right-0 top-0 p-4 hover:text-gray-600" aria-label="Close" onclick={close}>
				<IconX class="h-6 w-6" />
			</button>
		</form>
		<Citation {bibEntry} oncopy={close} />
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

			.full-width {
				grid-column: span 3;
			}

			.grid-span-2 {
				grid-column: span 2;
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

	.notes {
		box-shadow: inset 0px 0px 20px 1px hsla(216, 28%, 14%, 0.2);
		border: 3px solid hsla(216, 34%, 23%, 0.671);
	}

	:global(span.limit) {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}
</style>
