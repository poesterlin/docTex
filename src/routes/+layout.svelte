<script lang="ts">
	import { enhance } from '$app/forms';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	let { children, data }: { children: any; data: LayoutServerData } = $props();
</script>

<header class="bg-sky-600 py-4 text-white shadow-md">
	<div class="container mx-auto flex items-center justify-between space-x-6 px-6">
		{#if data.user}
			<p class="text-sm font-medium">
				Logged in as <span class="font-bold">{data.user.username}</span>
			</p>
			<nav>
				<ul class="flex space-x-4">
					<li>
						<a href="/" class="hover:underline">Projects</a>
					</li>
					<li>
						<a href="/styles" class="hover:underline">Styles</a>
					</li>
				</ul>
			</nav>
			<form method="post" action="/?/logout" use:enhance>
				<button
					type="submit"
					class="rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
				>
					Sign out
				</button>
			</form>
		{/if}
	</div>
</header>

<main class="container mx-auto p-6">
	{@render children()}
</main>
