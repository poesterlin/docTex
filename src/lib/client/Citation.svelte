<script lang="ts">
	import type { BibReference } from '$lib/server/db/schema';
	import { IconBook, IconCheck, IconCopy, IconFileText } from '@tabler/icons-svelte';

	interface CitationData {
		citationType: 'parenthetical' | 'text';
		prenote: string;
		referenceType: 'page' | 'chapter' | 'section';
		pageStart: string;
		pageEnd: string;
		suppressAuthor: boolean;
	}

	let citationData: CitationData = $state({
		citationType: 'text',
		prenote: '',
		referenceType: 'page',
		pageStart: '',
		pageEnd: '',
		suppressAuthor: false
	});

	let { bibEntry }: { bibEntry: BibReference } = $props();

	let copied = $state(false);

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

		// if (otherPostnote) {
		// 	postnote = postnote ? `${postnote}; ${otherPostnote}` : otherPostnote;
		// }

		return postnote;
	}

	function generateCitation() {
		const { citationType, prenote, suppressAuthor } = citationData;
		const postnote = generatePostnote();

		if (citationType === 'parenthetical') {
			const parts = [];

			if (prenote) {
				parts.push(prenote);
			}

			const citation = `${suppressAuthor ? '-' : ''}@${bibEntry.key}`;
			parts.push(citation);

			if (postnote) {
				parts.push(postnote);
			}

			return `[${parts.join(' ')}]`;
		} else {
			// Text citation
			return `${suppressAuthor ? '-' : ''}@${bibEntry.key}${postnote ? ` [${postnote}]` : ''}`;
		}
	}

	async function handleCopy() {
		await navigator.clipboard.writeText(generateCitation());
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement | HTMLSelectElement;
		const { name, value, type } = target;
		const newValue = type === 'checkbox' ? (target as HTMLInputElement).checked : value;

		citationData = { ...citationData, [name]: newValue };
	}
</script>

<div class="mx-auto max-w-4xl bg-gray-800 p-6">
	<div class="mb-6 flex items-center gap-2">
		<IconBook class="h-6 w-6 text-indigo-100" />
		<h1 class="text-2xl font-bold text-gray-200">Citation Generator</h1>
	</div>

	<!-- <div>
                <label class="mt-6 block text-sm font-medium text-gray-300">Citation Type</label>
                <select
                    name="citationType"
                    bind:value={citationData.citationType}
                    onchange={handleInputChange}
                    class="mt-1 block w-full rounded-md border-gray-300 text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="parenthetical">Parenthetical Citation [@key]</option>
                    <option value="text">Text Citation @key</option>
                </select>
            </div> -->

	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<label class="block text-sm font-medium text-gray-300">Reference</label>
			<select
				name="referenceType"
				bind:value={citationData.referenceType}
				onchange={handleInputChange}
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
					oninput={handleInputChange}
					placeholder={citationData.referenceType === 'page' ? 'Page number' : 'Start'}
				/>
			</div>
			<div>
				<input type="text" name="pageEnd" bind:value={citationData.pageEnd} oninput={handleInputChange} placeholder="End (optional)" />
			</div>
		</div>
	</div>

	<!-- <div>
		<label class="mt-6 block text-sm font-medium text-gray-300">Prenote (optional)</label>
		<input type="text" class="mt-2" name="prenote" bind:value={citationData.prenote} oninput={handleInputChange} placeholder="e.g., see" />
	</div> -->

	<!-- <div class="flex items-center pt-6">
				<input
					type="checkbox"
					id="suppressAuthor"
					name="suppressAuthor"
					bind:checked={citationData.suppressAuthor}
					onchange={handleInputChange}
					class="h-4 w-4 rounded border-gray-300 text-indigo-300 focus:ring-indigo-500"
				/>
				<label for="suppressAuthor" class="ml-2 block text-sm text-gray-300"> Suppress Author (-@key) </label>
			</div> -->

	<div class="mt-6 p-1">
		<label class="mb-2 block text-sm font-medium text-gray-300"> Generated Citation </label>
		<div class="rounded-md bg-gray-100 p-4 font-mono text-sm ring-4 ring-indigo-400">
			<pre class="whitespace-pre-wrap">{generateCitation()}</pre>
		</div>
	</div>

	<button
		class="mt-10 flex w-full items-center justify-center gap-4 rounded-md bg-indigo-500 p-2 p-4 font-medium text-white shadow hover:bg-indigo-600"
		onclick={handleCopy}
	>
		<span>Copy Citation</span>
		{#if copied}
			<IconCheck class="h-5 w-5" />
		{:else}
			<IconCopy class="h-5 w-5" />
		{/if}
	</button>
	<!-- <div class="rounded-md bg-blue-50 p-4">
				<h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
					<IconFileText class="h-4 w-4" />
					Pandoc Citation Examples
				</h3>
				<ul class="mt-2 space-y-2 text-sm text-gray-700">
					<li><code>[@doe99]</code> - Simple parenthetical citation</li>
					<li><code>[see @doe99]</code> - Citation with prenote</li>
					<li><code>[@doe99, p. 33]</code> - Single page reference</li>
					<li><code>[@doe99, pp. 33-35]</code> - Page range</li>
					<li><code>[@doe99, chap. 1]</code> - Chapter reference</li>
					<li><code>[@doe99, p. 33; and elsewhere]</code> - Complex postnote</li>
					<li><code>@doe99</code> - Simple text citation</li>
					<li><code>-@doe99</code> - Citation with suppressed author</li>
				</ul>
			</div> -->
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
