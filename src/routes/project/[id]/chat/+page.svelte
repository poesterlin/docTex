<script lang="ts">
	import { enhance } from '$app/forms';
	import ChatMessage from './Message.svelte';
	import { onMount } from 'svelte';

	type Message = { role: 'user' | 'assistant'; content: string; loading?: boolean; isHtml?: boolean; isError?: boolean };
	let messages = $state<Message[]>([{ role: 'assistant', content: 'Hi! 👋 How can I help you today?' }]);

	let userInput = $state('');
	let chatContainer: HTMLElement;

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 50);
	}

	function handleSubmit() {
		if (!userInput.trim()) return;

		messages.push({ role: 'user', content: userInput });
		userInput = '';
		scrollToBottom();

		messages = [
			...messages,
			{
				role: 'assistant',
				content: '',
				loading: true
			}
		];
		scrollToBottom();
	}

	onMount(() => {
		scrollToBottom();
	});
</script>

<div class="relative grid h-full max-h-full rounded-md shadow-lg backdrop-blur-md">
	<h2 class="mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Chat</h2>

	<div bind:this={chatContainer} class="area-content scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent overflow-auto">
		<!-- Chat messages -->
		{#each messages as message}
			<ChatMessage {...message} />
		{/each}
	</div>

	<!-- Chat input -->
	<div class="area-input w-full border-t border-gray-800/50 bg-neutral-900/80 px-4 py-4 shadow-lg backdrop-blur-xl">
		<form
			use:enhance={() => {
				handleSubmit();
				return async ({ result }) => {
					if (result.type === 'success' && result.data?.message && typeof result.data.message === 'string') {
						console.log(result.data.message);
						messages.splice(messages.length - 1, 1, {
							role: 'assistant',
							content: result.data.message,
							loading: false,
							isHtml: true
						});
						return;
					}

					messages.splice(messages.length - 1, 1, {
						role: 'assistant',
						content: 'An error occurred. Please try again.',
						loading: false,
						isError: true
					});
				};
			}}
			action="?/message"
			method="POST"
			class="mx-auto max-w-4xl p-4"
		>
			<div class="flex gap-3">
				<input
					type="text"
					name="message"
					bind:value={userInput}
					placeholder="Type your message..."
					class="flex-1 rounded-full border border-gray-800 bg-stone-900 px-6 py-3 text-sm text-gray-200 placeholder-gray-400 transition-colors focus:border-white/50 focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded-full bg-gray-700 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-500/90"
				>
					Send
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	div.grid {
		grid-template-areas: 'header' 'content' 'input';
		grid-template-rows: auto 1fr auto;
	}

	.area-content {
		grid-area: content;
	}

	.area-input {
		grid-area: input;
	}
</style>
