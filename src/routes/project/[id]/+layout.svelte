<script lang="ts">
	import type { LayoutServerData } from './$types';
	import { highlightLink } from '$lib/client/highlight-link.svelte';

	const { children, data }: { children: any; data: LayoutServerData } = $props();
	const { project } = data;
</script>

<div class="container mx-auto flex space-x-4 p-6">
	<aside class="w-1/4">
		<nav>
			<ul>
				<li>
					<a href="/project/{project.id}" class="hover:underline" use:highlightLink>Overview</a>
				</li>
				<li>
					<a href="/project/{project.id}/settings" class="hover:underline" use:highlightLink
						>Settings</a
					>
				</li>
				<li>
					<a href="/project/{project.id}/files" class="hover:underline" use:highlightLink>Files</a>
				</li>
				<li>
					<a href="/project/{project.id}/builds" class="hover:underline" use:highlightLink>Builds</a
					>
				</li>
				<li>
					<a href="/project/{project.id}/bib" class="hover:underline" use:highlightLink
						>Bibliography</a
					>
				</li>
			</ul>
		</nav>
	</aside>
	<section class="w-3/4">
		{@render children()}
	</section>
</div>

<style>
	li :global(a[aria-current='page']) {
		font-weight: bold;
	}
</style>
