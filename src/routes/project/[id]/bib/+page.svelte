<script lang="ts">
	import { enhance } from '$app/forms';
	import type { BibReference } from '$lib/server/db/schema';
	import type { PageData } from './$types';
	import Citation from '$lib/client/Citation.svelte';
	import { IconDownload, IconExternalLink, IconFile, IconLoader2, IconNote, IconSearch, IconUpload, IconX } from '@tabler/icons-svelte';
	import { submitWithToast } from '$lib/client/utils';
	import { createBibtex, formatDoi, isDoi, requestDoiInfo } from './doi';
	import { slide } from 'svelte/transition';

	let { data }: { data: PageData } = $props();

	let bibEntry = $state<BibReference>();
	let dialogEl: HTMLDialogElement;
	let doiInput = $state('');
	let isFetchingDoi = $state(false);
	let doiError = $state<string>();
	let bibContent = $state<string>();
	let isValidBib = $state(false); // Is the content in the textarea valid BibTeX?
	let filename = $state();

	function validateBibEntry(e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
		const el = e.currentTarget;
		const match = el.value.match(/@\w+\{(?<key>[\w-]+),/);
		const key = match?.groups?.key;
		isValidBib = Boolean(match && key);
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

	// --- DOI Fetching Logic ---
	async function fetchAndGenerateBibtex() {
		doiError = undefined;
		const formatted = formatDoi(doiInput);

		if (!formatted || !isDoi(formatted)) {
			doiError = 'Invalid DOI format. Please enter a valid DOI (e.g., 10.xxxx/xxxxx).';
			return;
		}

		isFetchingDoi = true;
		try {
			const doiInfo = await requestDoiInfo(formatted);
			if (doiInfo) {
				const generatedBibtex = createBibtex(doiInfo);
				bibContent = generatedBibtex; // Update the textarea content
				isValidBib = true;
			} else {
				// Should be caught by requestDoiInfo throwing an error, but handle just in case
				doiError = 'Could not retrieve information for this DOI.';
			}
		} catch (err: any) {
			console.error('DOI Fetch/Generate Error:', err);
			doiError = `Failed to get BibTeX: ${err.message || 'Unknown error'}`;
			bibContent = ''; // Clear content on error to avoid submitting partial/wrong data
		} finally {
			isFetchingDoi = false;
		}
	}

	function getFileName(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			filename = input.files[0].name;
		} else {
			filename = undefined;
		}
	}
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Files</h2>

<details class="mb-12 rounded-md border border-gray-700 bg-gray-800 p-4 shadow">
	<summary class="cursor-pointer text-lg font-medium text-white">Add New Entry</summary>

	<!-- DOI Input Section -->
	<div class="mb-6 mt-4 border-b border-gray-600 pb-6">
		<label for="doi-input" class="mb-2 block text-sm font-medium text-gray-300">Generate from DOI</label>
		<div class="flex items-center gap-2">
			<input
				id="doi-input"
				type="text"
				bind:value={doiInput}
				disabled={isFetchingDoi}
				class="block flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 shadow focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
				placeholder="e.g., 10.1038/nrd842"
			/>
			<button
				type="button"
				onclick={fetchAndGenerateBibtex}
				disabled={isFetchingDoi || !doiInput}
				class="flex items-center gap-1 rounded-md bg-pink-600 p-2 px-3 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
			>
				{#if isFetchingDoi}
					<IconLoader2 class="h-5 w-5 animate-spin" />
					<span>Fetching...</span>
				{:else}
					<IconSearch class="h-5 w-5" />
					<span>Lookup</span>
				{/if}
			</button>
		</div>
		{#if doiError}
			<p transition:slide={{ duration: 200 }} class="mt-2 text-sm text-red-500">{doiError}</p>
		{/if}
	</div>

	<!-- Manual Input / Generated Output Form -->
	<form
		action="?/addBib"
		method="POST"
		enctype="multipart/form-data"
		class="mt-4 space-y-5"
		use:enhance={() => {
			// Reset form fields visually after successful submission enhancement
			return async ({ update }) => {
				await update();
			};
		}}
	>
		<label class="block">
			<span class="text-sm font-medium text-gray-300">BibTeX Entry</span>
			<textarea
				bind:value={bibContent}
				oninput={(e) => validateBibEntry(e)}
				name="content"
				required
				class="mt-1 block h-60 w-full rounded-md border border-gray-600 bg-gray-700 p-2 font-mono text-sm leading-6 tracking-wider text-white placeholder-gray-400 shadow focus:border-blue-500 focus:ring-blue-500"
				placeholder="Paste your BibTeX entry here, or generate one using the DOI field above..."
			></textarea>
		</label>

		{#if !isValidBib && bibContent?.length}
			<!-- Show validation error only if something is typed and it's not valid -->
			<p transition:slide={{ duration: 200 }} class="!mt-2 text-sm text-red-500">
				BibTeX entry must start with @type{'{'}key, (e.g., @article{'{'}Smith2023,). Check the
				<a href="https://www.bibtex.com/g/bibtex-format/" target="_blank" rel="noopener noreferrer" class="underline hover:text-red-400"
					>BibTeX format guide</a
				>.
			</p>
		{/if}

		<!-- File Upload -->
		<div class="flex flex-col">
			<span class="flex-1 text-sm font-medium text-gray-300"> Source File (Optional) </span>
			<label
				class="mt-1 flex w-max cursor-pointer items-center gap-2 rounded-md border border-gray-600 bg-gray-700 p-2 px-3 text-gray-200 shadow hover:bg-gray-500"
				for="file-input"
			>
				<IconFile class="h-4 w-4" />
				<span>{filename ? 'Change File' : 'Attach File'}</span>
			</label>
			{#if filename}
				<span class="text-sm text-gray-400">{filename}</span>
			{/if}
		</div>
		<input type="file" id="file-input" name="file" class="sr-only" accept=".pdf,.doc,.docx,.txt,.md" onchange={getFileName} />

		<!-- URL -->
		<label class="block">
			<span class="text-sm font-medium text-gray-300">Source URL (Optional)</span>
			<input
				type="url"
				name="url"
				class="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 shadow focus:border-blue-500 focus:ring-blue-500"
				placeholder="e.g., https://example.com/source_document"
			/>
		</label>

		<!-- Notes -->
		<label class="block">
			<span class="text-sm font-medium text-gray-300">Notes (Optional)</span>
			<textarea
				name="notes"
				class="mt-1 block h-24 w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 shadow focus:border-blue-500 focus:ring-blue-500"
				placeholder="Add any personal notes about this reference..."
			></textarea>
		</label>

		<button
			type="submit"
			class="block w-full rounded-md bg-green-600 p-2.5 font-medium text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-500"
			disabled={!isValidBib}
		>
			Add Bibliography Entry
		</button>
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
				{/if}
				{#if bib.fileId}
					<a
						href={`/project/${data.project.id}/bib/file?id=${bib.id}`}
						class="rounded-md bg-gray-700 p-2 text-center underline hover:bg-gray-900 hover:text-gray-100"
						title="Open File"
						target="_blank"
					>
						<IconFile />
					</a>
				{/if}
				{#if bib.url || bib.fileId}
					<!-- spacer -->
					<div class="h-8 w-[1px] bg-gray-700"></div>
				{/if}
				<button onclick={() => open(bib)} class="rounded-md bg-gray-700 p-2 px-4 hover:bg-gray-900 hover:text-gray-100"
					>Generate Citation</button
				>
			</div>

			<details class="full-width border-t border-white pt-4 text-gray-400" open>
				<summary class="text-gray-400">Details</summary>
				<pre class="mt-2 max-h-[35svh] overflow-y-auto rounded-md bg-black p-4 text-gray-500">{@html parseBib(bib.content as string)}</pre>
			</details>

			<form action="?/update-note" method="POST" class="full-width" use:enhance onsubmit={(f) => submitWithToast(f, 'Notes saved')}>
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
