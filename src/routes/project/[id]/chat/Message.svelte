<script lang="ts">
	let {
		role,
		content,
		loading,
		isHtml,
		isError
	}: {
		role: 'user' | 'assistant';
		content: string;
		loading?: boolean;
		isHtml?: boolean;
		isError?: boolean;
	} = $props();
</script>

<div class="w-full px-4 py-2">
	<div class="mx-auto flex max-w-4xl {role === 'user' ? 'justify-end' : 'justify-start'}">
		{#if loading}
			<div class="ml-3 flex animate-pulse items-center space-x-2">
				<div class="h-4 w-4 rounded-full bg-gray-600"></div>
				<div class="h-4 w-32 rounded-full bg-gray-600"></div>
			</div>
		{:else}
			<div class="max-w-[80%] {role === 'user' ? 'bg-gray-700' : 'bg-stone-900'} rounded-2xl px-4 py-3 shadow-lg">
				<p class="text-sm {role === 'user' ? 'text-white' : 'text-gray-300'}" class:error={isError}>
					{#if isHtml}
						{@html content}
					{:else}
						{content}
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.error {
		color: red;
	}

	p {
		:global(h1) {
			font-size: 1.25rem;
			margin: 0.5rem 0;
		}

		:global(h2) {
			font-size: 1.125rem;
			margin: 0.5rem 0;
		}

		:global(h3) {
			font-size: 1rem;
			margin: 0.5rem 0;
		}

		:global(h4) {
			font-size: 0.875rem;
			margin: 0.5rem 0;
		}

		:global(h5) {
			font-size: 0.875rem;
			margin: 0.5rem 0;
		}

		:global(b) {
			font-weight: 600;
		}

		:global(p) {
			margin: 0.5rem 0;
		}

		:global(ul) {
			margin: 0.5rem 0;
			padding-left: 1.5rem;
		}

		:global(ol) {
			margin: 0.5rem 0;
			padding-left: 1.5rem;
		}

		:global(li) {
			margin: 0.5rem 0;
			list-style: disc;
		}
	}
</style>
