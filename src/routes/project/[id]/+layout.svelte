<script lang="ts">
	import type { LayoutServerData } from './$types';
	import { highlightLink } from '$lib/client/highlight-link.svelte';
	import { IconPlayerPlay } from '@tabler/icons-svelte';
	import { page } from '$app/state';

	const { children, data }: { children: any; data: LayoutServerData } = $props();
	const { project } = data;
</script>

{#snippet content()}
	<section class="pb-2xl m-auto block h-full w-full overflow-y-auto px-4 md:w-3/4 md:px-12">
		{@render children()}
	</section>
{/snippet}

{#if !data.isShared}
	<div class="flex flex-wrap items-start gap-6 md:h-full md:flex-nowrap md:gap-0">
		<aside class="w-full min-w-[200px] border-b border-gray-700 px-2 pb-4 md:h-full md:w-1/4 md:border-b-0 md:border-r">
			<div class="mb-6 flex items-center justify-between">
				<a href="/project/{project.id}">
					<h2 class="text-4xl font-semibold uppercase text-white">
						{project.name}
					</h2>
				</a>
				{#if !page.url.pathname.includes('/builds')}
					<form action="/project/{project.id}?/build" method="POST">
						<button type="submit" class="rounded-lg p-2 hover:bg-gray-700">
							<IconPlayerPlay />
						</button>
					</form>
				{/if}
			</div>

			<ul class="text-xl">
				<li>
					<a href="/project/{project.id}" class="hover:underline" use:highlightLink>Overview</a>
				</li>
				{#if !project.driveFolderId}
					<li>
						<a href="/project/{project.id}/upload" class="hover:underline" use:highlightLink>Files</a>
					</li>
				{/if}
				<li>
					<a href="/project/{project.id}/settings" class="hover:underline" use:highlightLink>Settings</a>
				</li>
				{#if project.driveFolderId}
					<li>
						<a href="/project/{project.id}/files" class="hover:underline" use:highlightLink>Files</a>
					</li>
				{/if}
				<li>
					<a href="/project/{project.id}/builds" class="hover:underline" use:highlightLink>Builds</a>
				</li>
				<li>
					<a href="/project/{project.id}/bib" class="hover:underline" use:highlightLink>Bibliography</a>
				</li>
				<li>
					<a href="/project/{project.id}/share" class="hover:underline" use:highlightLink>Invites</a>
				</li>
			</ul>
		</aside>

		{@render content()}
	</div>
{:else}
	{@render content()}
{/if}

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
