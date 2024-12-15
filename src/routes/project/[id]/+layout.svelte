<script lang="ts">
	import type { LayoutServerData } from './$types';
	import { highlightLink } from '$lib/client/highlight-link.svelte';

	const { children, data }: { children: any; data: LayoutServerData } = $props();
	const { project } = data;
</script>

<div class="flex flex-wrap items-start gap-6 md:h-full md:flex-nowrap md:gap-0">
	<aside class="w-full min-w-[200px] border-b border-gray-700 px-2 pb-4 md:h-full md:w-1/4 md:border-b-0 md:border-r">
		<a href="/project/{project.id}" class="mb-4 block">
			<h2 class="text-4xl font-semibold uppercase text-white">
				{project.name}
			</h2>
		</a>

		<ul class="text-xl">
			<li>
				<a href="/project/{project.id}" class="hover:underline" use:highlightLink>Overview</a>
			</li>
			<li>
				<a href="/project/{project.id}/settings" class="hover:underline" use:highlightLink>Settings</a>
			</li>
			<li>
				<a href="/project/{project.id}/files" class="hover:underline" use:highlightLink>Files</a>
			</li>
			<li>
				<a href="/project/{project.id}/builds" class="hover:underline" use:highlightLink>Builds</a>
			</li>
			<li>
				<a href="/project/{project.id}/bib" class="hover:underline" use:highlightLink>Bibliography</a>
			</li>
		</ul>
	</aside>

	<section class="pb-2xl block h-full w-full overflow-y-auto px-4 md:w-3/4 md:px-12">
		{@render children()}
	</section>
</div>

<style>
	li :global(a[aria-current='page']) {
		font-weight: bold;
		position: relative;
	}

	li :global(a[aria-current='page']::after) {
		content: '';
		position: absolute;
		bottom: 0;
		left: -1rem;
		top: 0;
		width: 2px;
		height: 1rem;
		margin: auto;
		background-color: #fff;
		margin-right: 1rem;
	}

	li a {
		padding: 0.5rem 0;
		display: block;
	}
</style>
