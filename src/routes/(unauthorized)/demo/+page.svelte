<script lang="ts">
	import * as CSL from 'citeproc'; // Import the citeproc library
	import Cite from 'citation-js';

	// Chosen style and locale
	let styleId = $state<string>('oscola');
	let localeId = $state<string>('en-US');

	// Output and status state
	let bibliographyHtml = $state<string>('');
	let isLoading = $state<boolean>(true);
	let error = $state<string | null>(null); // Allow null for no error
	let bibEntries = $state<string[]>([
		'@article{example1, author = {John Doe}, title = {Sample Article}, journal = {Journal of Examples}, year = {2023}, volume = {1}, number = {1}, pages = {1-10}}',
		'@book{example2, author = {Jane Smith}, title = {Sample Book}, publisher = {Example Press}, year = {2022}}',
		'@inproceedings{example3, author = {Alice Johnson}, title = {Sample Conference Paper}, booktitle = {Proceedings of the Example Conference}, year = {2021}}'
	]);

	const styleUrl = $derived<string>(`https://raw.githubusercontent.com/citation-style-language/styles/master/${styleId}.csl`);
	const localeUrl = $derived<string>(`https://raw.githubusercontent.com/Juris-M/citeproc-js-docs/master/locales-${localeId}.xml`);

	// Prepare data structures needed by citeproc-js
	interface CitationDataObject {
		citations: Record<string, CslJsonItem>; // Map ID to item
		itemIDs: string[];
	}
	const citationData = $derived.by<CitationDataObject>(() => {
		const citations: Record<string, CslJsonItem> = {};
		const itemIDs: string[] = [];
		bibEntries.flatMap(convertBibtexToCsl).forEach((item) => {
			// Ensure item and id exist before processing
			if (item?.id) {
				citations[item.id] = item;
				itemIDs.push(item.id);
			} else {
				console.warn('Skipping item due to missing id:', item);
			}
		});
		return { citations, itemIDs };
	});

	// --- Helper Function ---
	async function fetchText(url: string): Promise<string> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status} for URL: ${url}`);
			}
			return await response.text();
		} catch (err: unknown) {
			// Catch unknown type
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error(`Failed to fetch ${url}:`, errorMsg);
			// Re-throw specific error type or message
			throw new Error(`Failed to fetch ${url}: ${errorMsg}`);
		}
	}

	// --- Effect ($effect) ---
	$effect(() => {
		// Reset status
		isLoading = true;
		error = null;
		bibliographyHtml = '';

		if (citationData.itemIDs.length === 0) {
			error = 'No valid citation data provided.';
			isLoading = false;
			return;
		}

		generate(localeId, citationData);
	});

	const generate = async (localeId: string, data: CitationDataObject) => {
		try {
			console.log(`Fetching style: ${styleUrl}`);
			console.log(`Fetching locale: ${localeUrl}`);
			// Fetch style and locale
			const [styleXml, localeXml] = await Promise.all([fetchText(styleUrl), fetchText(localeUrl)]);
			console.log('Style and locale fetched.');

			// Create the sys object required by CSL.Engine, typed with CiteprocSys
			const citeprocSys: CiteprocSys = {
				retrieveLocale: (lang: string): string => {
					if (lang === localeId) {
						return localeXml;
					}
					console.warn(`Locale "${lang}" requested but only "${localeId}" was fetched.`);
					return ''; // Return empty string or handle error/fetch dynamically
				},
				retrieveItem: (id: string): CslJsonItem | undefined => {
					return data.citations[id];
				}
			};

			// Instantiate the CSL Engine
			console.log('Instantiating CSL Engine...');
			// Use the types defined in the declare module block
			const citeproc = new CSL.Engine(citeprocSys, styleXml, localeId, localeId);
			console.log('CSL Engine instantiated.');

			// Generate the bibliography
			console.log('Updating items:', data.itemIDs);
			citeproc.updateItems(data.itemIDs);

			console.log('Making bibliography...');
			// Use the BibliographyResult type
			const result: BibliographyResult = citeproc.makeBibliography();

			if (result && result[1] && result[1].length > 0) {
				bibliographyHtml = result[1].join(''); // result[1] is string[]
				console.log('Bibliography generated successfully.');
			} else {
				bibliographyHtml = 'Bibliography generation returned no results.';
				console.warn('makeBibliography result:', result);
			}
		} catch (err: unknown) {
			// Catch unknown type
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error('Error during bibliography generation:', errorMsg);
			error = `Failed to generate bibliography: ${errorMsg}`;
			bibliographyHtml = '';
			throw err;
		} finally {
			isLoading = false;
		}
	};

	function handleStyleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target) {
			styleId = target.value;
		}
	}

	function convertBibtexToCsl(bibtex: string) {
		try {
			// @ts-ignore
			const cite = new Cite(bibtex, { forceType: '@bibtex/text' });
			const cslData = cite.format('data', { format: 'object' });
			return cslData;
		} catch (error) {
			console.error('Error converting BibTeX to CSL JSON:', error);
			throw error; // Re-throw or handle as needed
		}
	}
</script>

<!-- Template remains the same as the JS version -->
<div class="citation-generator">
	<label>
		Style ID:
		<input type="text" value={styleId} oninput={handleStyleChange} />
	</label>

	<h2>Input Data BibTex:</h2>
	<div>
		{#each bibEntries as entry, i}
			<textarea rows="4" cols="50" bind:value={bibEntries[i]}></textarea>
		{/each}
	</div>

	<h2>Generated Bibliography ({styleId}):</h2>
	<div class="bibliography-output">
		{#if isLoading}
			<p>Loading bibliography...</p>
		{:else if error}
			<p class="error">Error: {error}</p>
		{:else}
			{@html bibliographyHtml}
		{/if}
	</div>
</div>

<style>
	.citation-generator {
		font-family: sans-serif;
		line-height: 1.6;
		max-width: 800px;
		margin: 2em auto;
		padding: 1em;
		border: 1px solid #eee;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
	}

	pre {
		background-color: black;
		padding: 1em;
		border-radius: 4px;
		overflow-x: auto;
		max-height: 200px; /* Limit height for large data */
	}

	.bibliography-output {
		border: 1px solid #ccc;
		padding: 1em;
		margin-top: 1em;
		background-color: black;
		min-height: 50px; /* Ensure it's visible when loading/empty */
		white-space: pre-wrap; /* Preserve line breaks from output if needed */
	}

	/* Render list items if the style generates them */
	.bibliography-output :global(div[class^='csl-']) {
		margin-bottom: 0.8em;
	}

	.error {
		color: #d32f2f;
		background-color: #ffebee;
		border: 1px solid #d32f2f;
		padding: 0.8em;
		border-radius: 4px;
	}

	label {
		display: block;
		margin-bottom: 0.5em;
	}

	input[type='text'] {
		padding: 0.4em;
		margin-left: 0.5em;
		border: 1px solid #ccc;
		border-radius: 3px;
		background: black;
	}
	small {
		color: #555;
	}
</style>
