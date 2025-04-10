<script lang="ts">
	import { IconUser } from '@tabler/icons-svelte';
</script>

<nav class="border-b border-gray-700 bg-gray-800">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center">
				<span class="font-serif text-xl font-bold text-pink-500">DocTex</span>
				<div class="ml-10 flex items-baseline space-x-4">
					<a href="/" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:underline">Projects</a>
					<a href="/styles" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:underline">Styles</a>
				</div>
			</div>

			<a href="/profile" class="text-gray-300">
				<IconUser class="h-6 w-6" />
			</a>
		</div>
	</div>
</nav>

<style>
	nav {
		view-transition-name: navbar;
	}
</style>