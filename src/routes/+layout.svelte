<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { toastStore } from '$lib/client/toast.svelte';
	import type { Page } from '@sveltejs/kit';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	import Navbar from './Navbar.svelte';

	let { children, data }: { children: any; data: LayoutServerData } = $props();

	let pageState = $state<Page<Record<string, string>, string | null>>();

	page.subscribe((page) => {
		pageState = page;
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{#if pageState?.route.id === '/(unauthorized)/intro'}
	{@render children()}
{:else}
	{#if data.user}
		<Navbar />
	{:else}
		<header class="bg-gray-800 py-4 text-white shadow-md">
			<div class="container mx-auto flex items-center justify-between space-x-6 px-6">
				<nav>
					<ul class="flex gap-4">
						<li>
							<a href="/styles" class="hover:underline">Styles</a>
						</li>
						{#if $page.route.id !== '/login'}
							<li>
								<a href="/login" class="hover:underline">Login</a>
							</li>
						{/if}
					</ul>
				</nav>
			</div>
		</header>
	{/if}

	<main class="container mx-auto p-6">
		{@render children()}

		{#each toastStore.toasts as toast (toast.id)}
			<div class="fixed bottom-4 right-4">
				<div class="rounded-md border-l-4 border-indigo-600 bg-white p-4 text-black shadow-md" style="min-width: 300px">
					<p class="font-medium">{toast.message}</p>
				</div>
			</div>
		{/each}
	</main>
{/if}

<style>
	:global(body) {
		font-family: Fraunces, sans-serif;
		position: relative;
		background: black;
		color: white;
	}

	:global(input),
	:global(select),
	:global(a),
	:global(textarea),
	:global(button) {
		background: none;
	}

	main {
		height: calc(100svh - 4.25rem);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes slide-from-right {
		from {
			transform: translateX(30px);
		}
	}

	@keyframes slide-to-left {
		to {
			transform: translateX(-30px);
		}
	}

	:root::view-transition-old(root) {
		animation:
			90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
			200ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
	}

	:root::view-transition-new(root) {
		animation:
			150ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
			200ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
	}
</style>
