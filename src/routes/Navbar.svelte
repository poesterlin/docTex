<script lang="ts">
	import { IconUser } from '@tabler/icons-svelte';
</script>

<nav class="border-b border-gray-700 bg-gray-800">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center">
				<span class="font-serif text-xl font-bold text-pink-400">DocTex</span>
				<div class="ml-10 flex items-baseline space-x-4">
					<a href="/" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:underline">Projects</a>
					<a href="/styles" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:underline">Styles</a>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<a href="/profile" class="text-gray-300">
					<IconUser class="h-6 w-6" />
				</a>
				<form method="post" action="/?/logout">
					<button class="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-gray-600">
						Sign out
					</button>
				</form>
			</div>
		</div>
	</div>
</nav>
