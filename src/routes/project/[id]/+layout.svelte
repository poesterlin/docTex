<script lang="ts">
	import type { LayoutServerData } from './$types';
	import { highlightLink } from '$lib/client/highlight-link.svelte';

	const { children, data }: { children: any; data: LayoutServerData } = $props();
	const { project } = data;
</script>

<div class="flex h-full">
	<aside class="h-full w-1/4 px-2">
		<a href="/project/{project.id}" class="mb-4 block">
			<h2 class="text-2xl font-semibold uppercase text-white">{project.name}</h2>
		</a>

		<ul>
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

	<section class="w-3/4 px-2">
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
		background-color: #fff;
		margin-right: 1rem;
	}

	aside {
		border-right: 1px solid #333;
	}
</style>
