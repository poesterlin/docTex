<script lang="ts">
	import { enhance } from '$app/forms';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	import { page } from '$app/stores';
	import { toastStore } from '$lib/client/toast.svelte';

	let { children, data }: { children: any; data: LayoutServerData } = $props();
</script>

<header class="bg-sky-600 py-4 text-white shadow-md">
	<div class="container mx-auto flex items-center justify-between space-x-6 px-6">
		{#if data.user}
			<p class="text-sm font-medium">
				Logged in as <span class="font-bold">{data.user.username}</span>
			</p>
			<nav>
				<ul class="flex gap-4">
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
		{:else}
			<nav>
				<ul class="flex gap-4">
					<li>
						<a href="/styles">Styles</a>
					</li>
					{#if $page.route.id !== '/login'}
						<li>
							<a href="/login">Login</a>
						</li>
					{/if}
				</ul>
			</nav>
		{/if}
	</div>
</header>

<main class="container mx-auto p-6">
	{@render children()}

	{#each toastStore.toasts as toast (toast.id)}
		<div class="fixed bottom-4 right-4">
			<div
				class="rounded-md border-l-4 border-indigo-600 bg-white p-4 shadow-md"
				style="min-width: 300px"
			>
				<p class="font-medium">{toast.message}</p>
			</div>
		</div>
	{/each}
</main>

<style>
	:global(body) {
		font-family: Fraunces, sans-serif;
		position: relative;
		background: black;
		padding-bottom: 100vh;
		color: white;
	}
	
	:global(body::before) {
		content: '';
		position: absolute;
		inset: 0;
		background: url('/noise.webp') repeat;
		background-size: 500px;
		opacity: 0.6;
		filter: saturate(0) invert(0.95) blur(1px);
		z-index: -1;
	}

	:global(input),
	:global(select),
	:global(a),
	:global(textarea),
	:global(button) {
		background: none;
	}

</style>
