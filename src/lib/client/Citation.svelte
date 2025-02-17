<script lang="ts">
	import type { BibReference } from '$lib/server/db/schema';
	import { IconBook, IconCopy } from '@tabler/icons-svelte';
	import { toastStore } from './toast.svelte';

	interface CitationData {
		referenceType: 'page' | 'chapter' | 'section';
		pageStart: string;
		pageEnd: string;
		suppressAuthor: boolean;
	}

	let citationData: CitationData = $state({
		referenceType: 'page',
		pageStart: '',
		pageEnd: '',
		suppressAuthor: false
	});

	let { bibEntry, oncopy }: { bibEntry: BibReference; oncopy: () => void } = $props();

	function generatePostnote() {
		const { referenceType, pageStart, pageEnd } = citationData;

		let postnote = '';

		if (pageStart || pageEnd) {
			const prefix = {
				page: pageEnd ? 'pp.' : 'p.',
				chapter: 'chap.',
				section: 'sec.'
			}[referenceType];

			postnote = `${prefix} ${pageStart}${pageEnd ? '–' + pageEnd : ''}`;
		}

		return postnote;
	}

	function generateCitation() {
		const postnote = generatePostnote();

		const parts = [`@${bibEntry.key}`];

		if (postnote) {
			parts.push(postnote);
		}

		const citation = parts.join(' ');

		const inBrackets = citationData.suppressAuthor;
		if (inBrackets) {
			return `[${citation}]`;
		}

		return citation;
	}

	function parseBibAuthor(bibtex: string) {
		const authorRegex = /author\s*=\s*\{(?<author>.*?)\}/s;
		const match = bibtex.match(authorRegex);

		if (match && match.groups && match.groups.author) {
			return match.groups.author.trim();
		}

		return null;
	}

	function generateOutputPreview() {
		let citation = `[1]`;

		const postnote = generatePostnote();
		if (postnote) {
			citation = `[1, ${postnote}]`;
		}

		if (citationData.suppressAuthor) {
			return citation;
		}

		const author = parseBibAuthor(bibEntry.content as string);
		const lastName = author?.split(',')[0] ?? 'Author';

		return `${lastName} ${citation}`;
	}

	async function handleCopy() {
		await navigator.clipboard.writeText(generateCitation());
		oncopy();

		toastStore.show('Citation copied to clipboard');
	}
</script>

<div class="mx-auto max-w-4xl bg-gray-800 p-6">
	<div class="mb-6 flex items-center gap-2">
		<IconBook class="h-6 w-6 text-indigo-100" />
		<h1 class="text-2xl font-bold text-gray-200">Citation Generator</h1>
	</div>

	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<label for="referenceType" class="block text-sm font-medium text-gray-300">Reference</label>
			<select
				id="referenceType"
				name="referenceType"
				bind:value={citationData.referenceType}
				class="rounded-md border-gray-300 text-sm text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			>
				<option value="page">Page Numbers</option>
				<option value="chapter">Chapter</option>
				<option value="section">Section</option>
			</select>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<input
					type="text"
					name="pageStart"
					bind:value={citationData.pageStart}
					placeholder={citationData.referenceType === 'page' ? 'Page number' : 'Start'}
				/>
			</div>
			<div>
				<input type="text" name="pageEnd" bind:value={citationData.pageEnd} placeholder="End (optional)" />
			</div>
		</div>
	</div>

	<div class="flex items-center pt-6">
		<input
			type="checkbox"
			id="suppressAuthor"
			name="suppressAuthor"
			bind:checked={citationData.suppressAuthor}
			class="h-4 w-4 rounded border-gray-300 text-indigo-300 focus:ring-indigo-500"
		/>
		<label for="suppressAuthor" class="ml-2 block text-sm text-gray-300"> Suppress Author </label>
	</div>

	<div class="mt-6 p-1">
		<label for="generatedCitation" class="mb-2 block text-sm font-medium text-gray-300"> Generated Citation </label>
		<div id="generatedCitation" class="rounded-md bg-gray-100 p-4 font-mono text-sm ring-4 ring-indigo-400">
			<pre class="whitespace-pre-wrap">{generateCitation()}</pre>
		</div>
	</div>

	<div>
		<label for="outputPreview" class="mt-8 block text-sm font-medium text-gray-300">Becomes:</label>
		<div id="outputPreview" class="rounded-md bg-gray-800 p-4 font-mono text-sm text-gray-200">
			<pre class="whitespace-pre-wrap">{generateOutputPreview()}</pre>
		</div>
	</div>

	<button
		class="mt-6 flex w-full items-center justify-center gap-4 rounded-md bg-indigo-500 p-2 p-4 font-medium text-white shadow hover:bg-indigo-600"
		onclick={handleCopy}
	>
		<span>Copy Citation</span>
		<IconCopy class="h-5 w-5" />
	</button>
</div>

<style>
	select > option {
		background-color: #1a202c;
		color: #e2e8f0;
	}

	input[type='text'] {
		background-color: #1a202c;
		color: #e2e8f0;
		border-color: #4a5568;
		padding: 0.5rem;
		border: 1px solid #4a5568;
		border-radius: 0.3rem;
		width: 100%;
		display: block;
	}
</style>
