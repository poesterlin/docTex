<script lang="ts">
	import { toastStore } from '$lib/client/toast.svelte';
	import { IconX } from '@tabler/icons-svelte';

	type CitationType = {
		id: string;
		name: string;
		explanation: string;
	};

	// Citation types with explanations
	const citationTypes = [
		{
			id: 'article',
			name: 'Article',
			explanation: 'An article from a journal or magazine.'
		},
		{
			id: 'book',
			name: 'Book',
			explanation: 'A book with an explicit publisher.'
		},
		{
			id: 'inproceedings',
			name: 'Conference Paper',
			explanation: 'An article in a conference proceedings.'
		},
		{
			id: 'thesis',
			name: 'Thesis',
			explanation: 'A thesis or dissertation.'
		},
		{
			id: 'misc',
			name: 'Website',
			explanation: "For web pages or other sources that don't fit into other categories."
		}
	] satisfies CitationType[];

	// Selected citation type
	let selectedType = $state<CitationType>();

	// Citation key (auto-generated)
	let citationKey = $state<string>();

	// Common fields for all citation types
	let commonFields = $state({
		author: '',
		title: '',
		year: new Date().getFullYear().toString()
	});

	// Type-specific fields
	let specificFields = $state<Record<string, string>>({});

	// Generated BibTeX
	let generatedBibTeX = $state('');

	// New custom field inputs
	let customFields = $state<Record<string, string>>({});
	let newCustomKey = $state('');
	let newCustomValue = $state('');

	// Handle citation type selection
	function selectType(type: CitationType) {
		selectedType = type;

		// Reset specific fields
		specificFields = {};

		// Set default fields based on type
		if (type.id === 'article') {
			specificFields = {
				journal: '',
				volume: '',
				number: '',
				pages: '',
				month: '',
				doi: ''
			};
		} else if (type.id === 'book') {
			specificFields = {
				publisher: '',
				address: '',
				edition: '',
				isbn: ''
			};
		} else if (type.id === 'inproceedings') {
			specificFields = {
				booktitle: '',
				pages: '',
				address: '',
				month: '',
				organization: ''
			};
		} else if (type.id === 'thesis') {
			specificFields = {
				school: '',
				type: 'PhD Thesis',
				address: '',
				month: ''
			};
		} else if (type.id === 'misc') {
			specificFields = {
				howpublished: '\\url{}',
				note: 'Accessed: ' + new Date().toISOString().split('T')[0],
				url: ''
			};
		}

		// Generate citation key
		updateCitationKey();
	}

	// Update citation key based on author and year
	function updateCitationKey() {
		if (commonFields.author && commonFields.year) {
			const authorLastName = commonFields.author.split(',')[0] || commonFields.author.split(' ').pop() || '';
			citationKey = authorLastName.toLowerCase().replace(/\s/g, '') + commonFields.year;
		} else {
			citationKey = 'cite' + Math.floor(Math.random() * 1000);
		}
	}

	function addCustomField() {
		if (!newCustomKey.trim()) return;
		customFields = {
			...customFields,
			[newCustomKey.trim()]: newCustomValue.trim()
		};
		newCustomKey = '';
		newCustomValue = '';
	}

	function removeCustomField(key: string) {
		const { [key]: _, ...rest } = customFields;
		customFields = rest;
	}

	// Generate BibTeX
	$effect(() => {
		if (selectedType) {
			let bibtex = `@${selectedType.id}{${citationKey},\n`;

			// Add common fields
			Object.entries(commonFields).forEach(([key, value]) => {
				if (value) bibtex += `  ${key} = {${value}},\n`;
			});

			// Add specific fields
			Object.entries(specificFields).forEach(([key, value]) => {
				if (value) bibtex += `  ${key} = {${value}},\n`;
			});

			// Add custom fields
			Object.entries(customFields).forEach(([key, value]) => {
				if (value) bibtex += `  ${key} = {${value}},\n`;
			});

			// Remove trailing comma and close entry
			bibtex = bibtex.slice(0, -2) + '\n}';

			generatedBibTeX = bibtex;
		} else {
			generatedBibTeX = '';
		}
	});

	// Copy to clipboard
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedBibTeX);
            toastStore.show('Copied to clipboard!');
		} catch (err) {
            toastStore.show('Failed to copy');
		}
	}

	// Watch for changes to update citation key
	$effect(() => {
		if (commonFields.author || commonFields.year) {
			updateCitationKey();
		}
	});
</script>

<h1 class="mb-12 text-3xl font-bold text-white">Citation Generator</h1>

<!-- Step 1: Select citation type -->
<div class="mb-16">
	<h2 class="mb-4 text-2xl font-semibold text-gray-100">&#8544;. Select Source Type</h2>
    <p class="mb-4 text-sm text-gray-400">Choose the type of source you want to cite.</p>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each citationTypes as type}
			<button
				class="rounded-lg border p-4 text-left transition-colors {selectedType?.id === type.id
					? 'border-pink-600 bg-gray-700 ring-1 ring-pink-600'
					: 'border-gray-700 bg-gray-800 hover:bg-gray-700'}"
				onclick={() => selectType(type)}
			>
				<div class="font-medium text-gray-100">{type.name}</div>
				<div class="mt-1 text-sm text-gray-400">{type.explanation}</div>
			</button>
		{/each}
	</div>
</div>

{#if selectedType}
	<!-- Step 2: Fill in details -->
	<div class="mb-12 border-y border-gray-700 py-12">
		<h2 class="mb-4 text-2xl font-semibold text-gray-100">&#8545;. Enter Details</h2>

		<!-- Common fields -->
		<div class="mb-4">
			<div class="space-y-3">
				<div>
					<label for="author" class="mb-1 block text-sm font-medium text-gray-300"> Author </label>
					<input
						id="author"
						type="text"
						bind:value={commonFields.author}
						placeholder="Last, First M. and Last, First M."
						class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-600"
					/>
				</div>
				<div>
					<label for="title" class="mb-1 block text-sm font-medium text-gray-300"> Title </label>
					<input
						id="title"
						type="text"
						placeholder="..."
						bind:value={commonFields.title}
						class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-600"
					/>
				</div>
				<div>
					<label for="year" class="mb-1 block text-sm font-medium text-gray-300"> Year </label>
					<input
						id="year"
						type="text"
						placeholder="2025"
						bind:value={commonFields.year}
						class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-600"
					/>
				</div>
			</div>
		</div>

		<!-- Type-specific fields -->
		{#if Object.keys(specificFields).length > 0}
			<div class="mt-12">
				<h3 class="mb-4 font-medium text-gray-100">
					{selectedType.name} Information
				</h3>
				<div class="space-y-3">
					{#each Object.entries(specificFields) as [key, value]}
						<div>
							<label for={key} class="mb-1 block text-sm font-medium text-gray-300">
								<!-- Simple capitalization -->
								{key.charAt(0).toUpperCase() + key.slice(1)}
							</label>
							<input
								id={key}
								type="text"
								placeholder="..."
								bind:value={specificFields[key]}
								class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-600"
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mt-12">
			<h3 class="mb-1 font-medium text-gray-100">Custom Fields</h3>
            <p class="mb-4 text-sm text-gray-400">Add any additional fields you want to include in the BibTeX entry. This is usually not required.</p>

			<div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end">
				<div class="flex-1">
					<label for="new-key" class="mb-1 block text-sm font-medium text-gray-300">Field Name</label>
					<input
						id="new-key"
						type="text"
						bind:value={newCustomKey}
						placeholder="e.g., note"
						class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-600"
					/>
				</div>
				<div class="flex-1">
					<label for="new-value" class="mb-1 block text-sm font-medium text-gray-300">Field Value</label>
					<input
						id="new-value"
						type="text"
						bind:value={newCustomValue}
						placeholder="e.g., Some note"
						class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-600"
					/>
				</div>
				<button
					type="button"
					onclick={addCustomField}
					class="mt-2 rounded-md bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 md:mt-0"
				>
					Add Field
				</button>
			</div>

			<!-- List custom fields with remove buttons -->
			{#each Object.entries(customFields) as [key, value]}
				<div class="flex items-center gap-2">
					<div class="flex-1">
						<label for="custom-{key}" class="mb-1 block text-sm font-medium text-gray-300">{key}</label>
						<input
							id="custom-{key}"
							type="text"
							bind:value={customFields[key]}
							class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-600"
						/>
					</div>
					<button
						type="button"
						onclick={() => removeCustomField(key)}
						class="mt-6 rounded-md px-2 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-500"
					>
						<!-- Remove -->
						<IconX class="h-4 w-4" />
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Step 3: Generated BibTeX -->
	<div class="pb-16">
		<h2 class="mb-4 text-2xl font-semibold text-gray-100">&#8546;. Generated Bibliography Entry</h2>

		<div class="mb-4">
			<label for="key" class="mb-1 block text-sm font-medium text-gray-300"> Citation Key </label>
			<input
				type="text"
				id="key"
				bind:value={citationKey}
				class="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-600"
			/>
			<!-- Lighter helper text -->
			<p class="mt-1 text-xs text-gray-400">Unique identifier for this citation (e.g., AuthorYear)</p>
		</div>
		<!-- Darker code block -->
		<div class="rounded-md border border-gray-700 bg-gray-800 p-4">
			<pre class="whitespace-pre-wrap font-mono text-sm text-gray-300">{generatedBibTeX}</pre>
		</div>
		<div class="mt-4 flex items-center">
			<!-- Darker button with lighter text and pink focus -->
			<button
				onclick={copyToClipboard}
				class="rounded-md bg-pink-600 px-4 py-2 text-gray-200 transition-colors hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 focus:ring-offset-gray-900"
			>
				Copy to Clipboard
			</button>
		</div>
	</div>
{/if}
