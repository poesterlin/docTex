<script lang="ts">
	import { IconBook, IconCopy, IconX } from '@tabler/icons-svelte';
	import * as CSL from 'citeproc';
	import Cite from 'citation-js';
	// Assuming toastStore is correctly set up elsewhere
	import { toastStore } from './toast.svelte';
	import type { BibReference } from '$lib/server/db/schema';
	import Modal from './Modal.svelte';
	import { onMount } from 'svelte';

	// From Demo 2
	interface InTextCitationData {
		referenceType: 'page' | 'chapter' | 'section';
		pageStart: string;
		pageEnd: string;
		suppressAuthor: boolean;
	}

	type BibliographyResult = [
		{
			bibstart?: string;
			bibend?: string;
			bibliography_errors?: any[]; // Define more specifically if needed
			// other properties...
		},
		string[] // Array of formatted citation strings (HTML)
	];

	// Type for processCitationCluster result (simplified)
	type CitationClusterResult = [
		any, // Status data
		Array<[number, string]> // Array of [index, htmlString] pairs
	];

	let { bibEntry, oncopy }: { bibEntry: BibReference; oncopy: () => void } = $props();

	// For Bibliography Generation (from Demo 1)
	let styleId = $state<string>('apa');
	let localeId = $state<string>('en-US');
	let bibliographyHtml = $state<string>('');
	let isLoadingBibliography = $state<boolean>(true);
	let bibliographyError = $state<string | null>(null);

	// For In-Text Citation Generation (from Demo 2)
	let inTextCitationData = $state<InTextCitationData>({
		referenceType: 'page',
		pageStart: '',
		pageEnd: '',
		suppressAuthor: false
	});

	onMount(() => {
		// Load initial state from localStorage if available
		const storedStyle = localStorage.getItem('citation-style');
		if (storedStyle) {
			styleId = storedStyle;
		}
	});

	$effect(() => {
		localStorage.setItem('citation-style', styleId);
	});

	// --- Derived State ($derived) ---

	// URLs for CSL files (from Demo 1)
	const styleUrl = $derived<string>(`https://raw.githubusercontent.com/citation-style-language/styles/master/${styleId}.csl`);
	const localeUrl = $derived<string>(
		// Using a potentially more standard source for locales if Juris-M is outdated
		`https://raw.githubusercontent.com/citation-style-language/locales/master/locales-${localeId}.xml`
		// `https://raw.githubusercontent.com/Juris-M/citeproc-js-docs/master/locales-${localeId}.xml` // Original URL
	);

	// Convert the single BibTeX entry to CSL JSON (adapting from Demo 1)
	const cslJsonItem = $derived.by<CslJsonItem | null>(() => {
		if (!bibEntry?.content || typeof bibEntry.content !== 'string') {
			console.warn('BibEntry content is missing or not a string.');
			bibliographyError = 'BibTeX content is missing or invalid.'; // Set error early
			return null;
		}
		try {
			// @ts-ignore - citation-js types might not be fully up-to-date
			const cite = new Cite(bibEntry.content, { forceType: '@bibtex/text' });
			const cslDataArray = cite.format('data', { format: 'object' });
			// citation-js returns an array, even for single entries
			if (cslDataArray && cslDataArray.length > 0) {
				// Ensure the item has an ID, default to bibEntry.key if missing
				const item = cslDataArray[0];
				if (!item.id) {
					item.id = bibEntry.key; // Use the BibTeX key as fallback ID
				}
				return item as CslJsonItem;
			}
			bibliographyError = 'Failed to convert BibTeX to CSL JSON.';
			return null;
		} catch (error: unknown) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.error('Error converting BibTeX to CSL JSON:', errorMsg);
			bibliographyError = `Error converting BibTeX: ${errorMsg}`;
			return null;
		}
	});

	// Generate the short in-text citation string (from Demo 2) - This is the Pandoc/LaTeX style string
	const generatedCitationString = $derived.by<string>(() => {
		const postnote = generatePostnote();
		const parts = [`@${bibEntry.key}`];

		if (postnote) {
			parts.push(postnote);
		}

		const citation = parts.join(', '); // Use comma separation for Pandoc style

		return inTextCitationData.suppressAuthor ? `[${citation}]` : citation;
	});

	// Fetch text utility (from Demo 1)
	async function fetchText(url: string): Promise<string> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status} for URL: ${url}`);
			}
			return await response.text();
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error(`Failed to fetch ${url}:`, errorMsg);
			throw new Error(`Failed to fetch ${url}: ${errorMsg}`);
		}
	}

	// Generate postnote part for in-text citation (from Demo 2)
	function generatePostnote(): string {
		const { referenceType, pageStart, pageEnd } = inTextCitationData;
		let postnote = '';

		if (pageStart) {
			// Only add prefix if pageStart has a value
			const prefixMap = {
				page: pageEnd ? 'pp' : 'p',
				chapter: 'ch',
				section: 's'
			};
			const prefix = prefixMap[referenceType];
			postnote = `${prefix} ${pageStart}${pageEnd ? '–' + pageEnd : ''}`;
		} else if (pageEnd) {
			// Handle case where only pageEnd is provided
			const prefixMap = { page: 'p', chapter: 'ch', section: 's' };
			const prefix = prefixMap[referenceType];
			postnote = `${prefix} ${pageEnd}`;
		}

		return postnote;
	}

	// Helper to generate the locator string value for processCitationCluster
	function generateLocatorString(): string {
		const { pageStart, pageEnd } = inTextCitationData;
		if (pageStart && pageEnd) {
			return `${pageStart}–${pageEnd}`; // Use en-dash for ranges
		}
		// Return start or end if only one is provided, or empty string
		return pageStart || pageEnd || '';
	}

	// Parse author from BibTeX string (from Demo 2)
	function parseBibAuthor(bibtex: string | unknown): string | null {
		if (typeof bibtex !== 'string') return null;
		// More robust regex allowing for different spacing and quote types
		const authorRegex = /author\s*=\s*[{"'](?<author>.*?)["'}]\s*,?\s*$/ims;
		const match = bibtex.match(authorRegex);

		if (match?.groups?.author) {
			// Remove potential wrapping braces/quotes if they weren't captured
			return match.groups.author.replace(/^{|}$|^"|"$/g, '').trim();
		}
		return null;
	}

	// Copy generated in-text citation (from Demo 2)
	async function handleCopy() {
		// Copy the Pandoc-style citation string
		await navigator.clipboard.writeText(generatedCitationString);
		oncopy(); // Call the provided callback
		toastStore.show('Citation string copied to clipboard');
	}

	// --- CSL Engine Setup ---

	// Reactive variable for fetched style XML
	let styleXml = $state<string | null>(null);
	// Reactive variable for fetched locale XML
	let localeXml = $state<string | null>(null);

	// Effect to fetch CSL style and locale XML when URLs change
	$effect(() => {
		// Register dependencies
		const currentStyleUrl = styleUrl;
		const currentLocaleUrl = localeUrl;

		// Reset state before fetching
		styleXml = null;
		localeXml = null;
		bibliographyError = null; // Reset errors
		isLoadingBibliography = true; // Set loading true during fetch

		console.log(`Fetching Style: ${currentStyleUrl}`);
		console.log(`Fetching Locale: ${currentLocaleUrl}`);

		Promise.all([fetchText(currentStyleUrl), fetchText(currentLocaleUrl)])
			.then(([style, locale]) => {
				console.log('CSL files fetched successfully.');
				styleXml = style;
				localeXml = locale;
				// Loading will be set to false by the effects that *use* this data
			})
			.catch((err) => {
				console.error('Error fetching CSL files:', err);
				bibliographyError = `Failed to fetch CSL style/locale: ${err.message}`;
				isLoadingBibliography = false; // Set loading false on fetch error
			});
	});

	// Derived state for the citeproc-js system object
	const citeprocSys = $derived.by<CiteprocSys | null>(() => {
		const currentLocaleXml = localeXml; // Depend on fetched locale
		const currentItem = cslJsonItem; // Depend on converted item
		const currentLocaleId = localeId; // Depend on selected locale ID

		if (!currentLocaleXml || !currentItem) {
			// console.log('citeprocSys: Not ready - localeXml or cslJsonItem missing.');
			return null; // Not ready if locale or item is missing
		}

		// console.log('citeprocSys: Ready.');
		return {
			retrieveLocale: (lang: string): string => {
				// console.log(`retrieveLocale called with: ${lang}. Comparing with: ${currentLocaleId}`);
				// Provide the fetched locale XML if the requested lang matches the current localeId
				if (lang === currentLocaleId) {
					return currentLocaleXml;
				}
				console.warn(`Locale "${lang}" requested but only "${currentLocaleId}" was fetched.`);
				// Fallback: return the fetched XML anyway, or empty string
				return currentLocaleXml || '';
			},
			retrieveItem: (id: string): CslJsonItem | undefined => {
				// console.log(`retrieveItem called with: ${id}. Comparing with: ${currentItem.id}`);
				// For a single item, just check if the requested ID matches
				return id === currentItem.id ? currentItem : undefined;
			}
		};
	});

	// Derived state for the CSL Engine instance
	const engine = $derived.by<CSL.Engine | null>(() => {
		const sys = citeprocSys;
		const style = styleXml;
		const currentLocaleId = localeId; // Use the state variable for locale ID

		if (!sys || !style) {
			// console.log('Engine not ready: sys or style missing');
			return null; // Not ready if sys or style XML is missing
		}

		try {
			// Instantiate the CSL Engine
			console.log(`Instantiating CSL Engine with locale: ${currentLocaleId}`);
			const citeproc = new CSL.Engine(sys, style, currentLocaleId);
			console.log('CSL Engine instantiated successfully.');
			return citeproc;
		} catch (err) {
			console.error('Error instantiating CSL Engine:', err);
			bibliographyError = `Failed to initialize citation engine: ${err instanceof Error ? err.message : String(err)}`;
			return null;
		}
	});

	// --- Bibliography Generation Logic ---
	$effect(() => {
		// Dependencies
		const currentEngine = engine;
		const currentItem = cslJsonItem;

		// Reset status
		isLoadingBibliography = true;
		// Keep existing error if engine creation failed, otherwise clear it before trying
		// if (currentEngine) bibliographyError = null;
		bibliographyHtml = '';

		if (!currentEngine || !currentItem) {
			// console.log('Bibliography effect: Engine or item not ready.');
			// If engine is null, an error might already be set during its creation
			if (!currentItem && !bibliographyError) {
				bibliographyError = 'Cannot generate bibliography: Invalid BibTeX data.';
			}
			isLoadingBibliography = false;
			return; // Stop if engine or item isn't ready
		}

		try {
			console.log('Updating items for bibliography:', [currentItem.id]);
			// Ensure item is registered in this engine instance state if needed (might be redundant if engine is recreated)
			currentEngine.updateItems([currentItem.id]);

			console.log('Making bibliography...');
			const result: BibliographyResult = currentEngine.makeBibliography();

			if (result && result[1] && result[1].length > 0) {
				bibliographyHtml = result[1].join(''); // result[1] is string[]
				console.log('Bibliography generated successfully.');
				// Clear error only on successful generation
				// bibliographyError = null; // Let errors from engine creation persist if they occurred
			} else {
				bibliographyHtml = 'Bibliography generation returned no results.';
				console.warn('makeBibliography result:', result);
				// Set error if generation yields nothing, but don't overwrite engine init errors
				if (!bibliographyError) {
					bibliographyError = 'Bibliography generation returned no results.';
				}
			}
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error('Error during bibliography generation effect:', errorMsg);
			bibliographyError = `Failed to generate bibliography: ${errorMsg}`;
			bibliographyHtml = ''; // Clear output on error
		} finally {
			isLoadingBibliography = false;
		}
	});

	// --- Formatted Citation (Footnote) Generation ---
	const formattedFootnoteHtml = $derived.by<string>(() => {
		// Dependencies
		const currentEngine = engine;
		const currentItem = cslJsonItem;
		const citationDetails = inTextCitationData; // Depend on user input for locators

		if (!currentEngine || !currentItem) {
			// console.log('Footnote generation: Engine or item not ready.');
			return ''; // Not ready
		}

		// Avoid running if there was an engine init error
		if (bibliographyError && bibliographyError.startsWith('Failed to initialize')) {
			return `<i class="text-red-400">${bibliographyError}</i>`;
		}

		try {
			// 1. Construct the citation item for processCitationCluster
			const locatorValue = generateLocatorString();
			const citationItem: any = {
				// Use 'any' for flexibility or define a more specific type
				id: currentItem.id,
				'suppress-author': citationDetails.suppressAuthor
				// Add prefix/suffix here if needed based on UI elements
				// prefix: "see ",
				// suffix: " (emphasis added)"
			};

			// Only add locator and label if a locator value exists
			if (locatorValue) {
				citationItem.locator = locatorValue; // e.g., "5" or "5-10"
				// Map referenceType to CSL label terms ('page', 'chapter', 'section', etc.)
				citationItem.label = citationDetails.referenceType;
			}

			// 2. Construct the citation cluster object
			const citationCluster = {
				citationItems: [citationItem],
				properties: {
					noteIndex: 1 // Treat this as the first citation in a sequence
				}
			};

			console.log('Processing citation cluster:', JSON.stringify(citationCluster, null, 2));

			// 3. Call processCitationCluster
			// Ensure items are updated *before* processing cluster in case engine state was reset
			currentEngine.updateItems([currentItem.id]);
			// @ts-expect-error
			const result: CitationClusterResult = currentEngine.processCitationCluster(citationCluster, [], []);

			console.log('processCitationCluster result:', result);

			// 4. Extract the formatted string
			if (result && result[1] && result[1].length > 0 && result[1][0]) {
				// result[1][0] should be [noteIndex, htmlString]
				return result[1][0][1]; // Get the HTML string
			} else {
				console.warn('processCitationCluster returned no formatted citation.');
				return '<i>Could not generate formatted citation. Check CSL style and input.</i>';
			}
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error('Error during footnote generation:', errorMsg);
			// Optionally set a specific error state for footnotes
			return `<i class="text-red-400">Error generating citation: ${errorMsg}</i>`;
		}
	});

	function copyFootnote() {
		// Copy the formatted footnote HTML to clipboard
		navigator.clipboard.writeText(formattedFootnoteHtml);
		toastStore.show('Formatted footnote copied to clipboard');
	}

	function copyBibliography() {
		// Copy the bibliography HTML to clipboard
		navigator.clipboard.writeText(bibliographyHtml);
		toastStore.show('Formatted bibliography copied to clipboard');
	}
</script>

<Modal onClose={oncopy} cancelButton={false}>
	<div class="flex items-center justify-between gap-3 border-b border-gray-700 pb-4">
		<div class="flex items-center gap-2">
			<IconBook class="h-7 w-7 text-indigo-400" />
			<h1 class="text-2xl font-semibold text-gray-100">Citation Generator</h1>
		</div>
		<form method="dialog">
			<button class="p-2 hover:text-gray-600" aria-label="Close" onclick={onclose}>
				<IconX class="h-6 w-6" />
			</button>
		</form>
	</div>

	<!-- In-Text Citation Configuration -->
	<div class="mt-4 space-y-4 rounded-md bg-gray-700 p-4">
		<h2 class="text-lg font-medium text-gray-200">Citation Options</h2>
		<div class="space-y-3">
			<div class="flex items-center justify-between gap-4">
				<label for="referenceType" class="block text-sm font-medium text-gray-300">Locator Type</label>
				<select
					id="referenceType"
					name="referenceType"
					bind:value={inTextCitationData.referenceType}
					class="w-1/2 rounded-md border-gray-600 py-0.5 bg-gray-800 text-sm text-gray-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
				>
					<option value="page">Page(s)</option>
					<option value="chapter">Chapter</option>
					<option value="section">Section</option>
					<!-- Add other CSL locator terms if needed: figure, table, verse, line, etc. -->
				</select>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="pageStart" class="mb-1 block text-sm font-medium text-gray-300">
						{#if inTextCitationData.referenceType === 'page'}Page Number{:else}Start{/if}
					</label>
					<input
						type="text"
						id="pageStart"
						name="pageStart"
						bind:value={inTextCitationData.pageStart}
						placeholder={inTextCitationData.referenceType === 'page' ? 'e.g., 5' : 'e.g., 1'}
						class="w-full rounded-md border-gray-600 bg-gray-800 p-2 text-sm text-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
					/>
				</div>
				<div>
					<label for="pageEnd" class="mb-1 block text-sm font-medium text-gray-300"> End (Optional) </label>
					<input
						type="text"
						id="pageEnd"
						name="pageEnd"
						bind:value={inTextCitationData.pageEnd}
						placeholder="e.g., 10"
						class="w-full rounded-md border-gray-600 bg-gray-800 p-2 text-sm text-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
					/>
				</div>
			</div>
		</div>

		<div class="flex items-center pt-2">
			<input
				type="checkbox"
				id="suppressAuthor"
				name="suppressAuthor"
				bind:checked={inTextCitationData.suppressAuthor}
				class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-400 focus:ring-indigo-500"
			/>
			<label for="suppressAuthor" class="ml-2 block text-sm text-gray-300"> Suppress Author </label>
		</div>

		<!-- Generated In-Text Citation String -->
		<div class="pt-4">
			<label for="generatedCitation" class="mb-1 block text-sm font-medium text-gray-300">
				Copyable Citation String (e.g., for LaTeX)
			</label>
			<div id="generatedCitation" class="min-h-[3em] rounded-md bg-gray-800 p-3 font-mono text-sm text-gray-100 ring-1 ring-gray-600">
				<pre class="whitespace-pre-wrap">{generatedCitationString}</pre>
			</div>
		</div>

		<button
			class="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
			onclick={handleCopy}
			title="Copy the Pandoc/LaTeX style citation string"
		>
			<IconCopy class="h-5 w-5" />
			<span>Copy Citation String</span>
		</button>
	</div>

	<!-- Bibliography Configuration and Output -->
	<div class="mt-4 space-y-4 rounded-md bg-gray-700 p-4">
		<h2 class="text-lg font-medium text-gray-200">Bibliography Options</h2>

		<div class="flex items-center justify-between gap-4 border-b border-gray-600 pb-5">
			<label for="styleId" class="block text-sm font-medium text-gray-200">Citation Style</label>
			<input
				type="text"
				id="styleId"
				bind:value={styleId}
				placeholder="e.g., apa, oscola, chicago-author-date"
				class="w-1/2 rounded-md border-gray-600 bg-gray-800 p-2 text-sm text-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
			/>
			<!-- locale selector -->
			<!-- <label for="localeId">Locale:</label> <input type="text" id="localeId" bind:value={localeId} /> -->
		</div>

		{#if engine}
			{#if isLoadingBibliography}
				<p class="text-sm text-gray-400">Loading style and data...</p>
			{:else if bibliographyError}
				<p class="rounded border border-red-400 bg-red-900/30 p-2 text-sm text-red-300">
					Error: {bibliographyError}
				</p>
			{:else}
				<h2 class="text-md font-medium text-gray-200 flex items-center justify-between">
					Citation
					<button onclick={copyFootnote} title="Copy formatted footnote">
						<IconCopy class="h-5 w-5" />
					</button>
				</h2>
				<p class="text-sm text-gray-400">
					This shows how the citation might appear as a footnote or in text citation, according to the style's rules.
				</p>
				<div class="min-h-[3em] rounded-md bg-gray-800 p-4 ring-1 ring-gray-600">
					<div class="formatted-footnote text-gray-200">{@html formattedFootnoteHtml}</div>
				</div>
			{/if}

			{#if isLoadingBibliography}
				<p class="text-sm text-gray-400">Loading bibliography...</p>
			{:else if bibliographyError}
				<p class="rounded border border-red-400 bg-red-900/30 p-2 text-sm text-red-300">
					Error: {bibliographyError}
				</p>
			{:else}
				<h2 class="text-md pt-6 font-medium text-gray-200 flex items-center justify-between">
					Bibliography Entry

					<button onclick={copyBibliography} title="Copy formatted bibliography">
						<IconCopy class="h-5 w-5" />
					</button>
				</h2>
				<p class="text-sm text-gray-400">
					This shows how the citation might appear in a bibliography, according to the style's rules.
				</p>
				<div class="bibliography-output min-h-[6em] rounded-md bg-gray-800 p-4 ring-1 ring-gray-600">
					<div class="formatted-bibliography text-gray-200">
						{@html bibliographyHtml}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</Modal>

<style>
	/* Style for select dropdown options */
	select > option {
		background-color: #2d3748; /* gray-800 */
		color: #e2e8f0; /* gray-200 */
	}

	/* Style for the footnote output */
	.formatted-footnote :global(a) {
		color: #818cf8; /* indigo-400 */
		text-decoration: underline;
	}
	.formatted-footnote :global(i),
	.formatted-footnote :global(em) {
		font-style: italic;
	}
	.formatted-footnote :global(b),
	.formatted-footnote :global(strong) {
		font-weight: bold;
	}

	/* Add styles for the CSL bibliography output if needed (e.g., list items) */
	.formatted-bibliography :global(div[class^='csl-']) {
		margin-bottom: 0.5em;
		line-height: 1.5;
	}
	.formatted-bibliography :global(i),
	.formatted-bibliography :global(em) {
		/* Example: Ensure italics are rendered correctly if needed */
		font-style: italic;
	}
	.formatted-bibliography :global(b),
	.formatted-bibliography :global(strong) {
		font-weight: bold;
	}
	/* Add more global styles for CSL output elements as required by different styles */
</style>
