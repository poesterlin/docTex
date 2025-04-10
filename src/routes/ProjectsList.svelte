<script lang="ts">
	import type { Project } from '$lib/server/db/schema';

	let { projects }: { projects: Project[] } = $props();
</script>

<div class="grid gap-4">
	{#each projects as project}
		<a
			href="/project/{project.id}"
			class="hover:bg-gray-750 block rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600"
		>
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-bold text-white">{project.name}</h3>
				<!-- <span class="text-sm text-gray-400">Last modified: {project}</span> -->
			</div>
			<!-- <div class="mt-2 flex items-center gap-2">
				<span class="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-800">
					{project.status}
				</span>
			</div> -->
		</a>
	{:else}
		<p class="text-gray-400">No projects yet.</p>
	{/each}
</div>
