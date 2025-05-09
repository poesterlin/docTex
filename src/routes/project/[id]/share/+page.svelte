<script lang="ts">
	import { IconCancel, IconCopy, IconDownload, IconLink, IconLoader, IconPlayerPlay, IconPlus } from '@tabler/icons-svelte';
	import type { PageData } from './$types';
	import { toastStore } from '$lib/client/toast.svelte';
	import { enhance } from '$app/forms';
	import Form from '$lib/client/Form.svelte';
	import ConfirmSubmit from '$lib/client/ConfirmSubmit.svelte';

	let { data }: { data: PageData } = $props();

	const intl = Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	});

	function format(timestamp: Date) {
		return intl.format(timestamp);
	}

	function copy(token: string) {
		const url = `${location.host}/invite?token=${token}`;
		navigator.clipboard.writeText(url);
		toastStore.show('Link copied to clipboard');
	}
</script>

<h2 class="sticky top-0 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Active Invites</h2>

<form
	action="?/invite"
	method="POST"
	use:enhance={() => {
		return async ({ update }) => {
			await update();

			copy(data.invites[0].token);
		};
	}}
>
	<button type="submit" class="items center my-6 flex justify-between gap-4 rounded-md bg-pink-600 p-4 text-white shadow hover:bg-pink-700">
		<IconPlus />
		<span>Generate Invite</span>
	</button>
</form>

<p class="mb-6 text-gray-400">Share this link with collaborators to give them access to this projects output pdf.</p>

<ul class="space-y-6 divide-y divide-gray-700">
	{#each data.invites as invite}
		<li class="flex items-center justify-between gap-4 rounded-md bg-gray-800 p-4 text-white shadow">
			<b class="font-semibold text-gray-400">{format(invite.createdAt)}</b>

			<button onclick={() => copy(invite.token)} class="flex items-center gap-2 rounded-md p-2 text-gray-400 hover:bg-gray-700/50">
				<IconLink />
				<span>Copy Link</span>
			</button>

			<Form action="?/cancel">
				{#snippet children(loading)}
					<input type="hidden" name="id" value={invite.id} />
					<ConfirmSubmit class="flex items-center gap-2 rounded-md p-2 p-2 text-gray-400 hover:text-red-500">
						{#if loading}
							<IconLoader class="m-auto animate-spin" />
						{:else}
							<span>Cancel Invite</span>
							<IconCancel />
						{/if}
					</ConfirmSubmit>
				{/snippet}
			</Form>
		</li>
	{:else}
		<li class="flex flex-col gap-4 rounded-md p-4 text-white shadow">
			<p class="text-gray-400">No active invites</p>
		</li>
	{/each}
</ul>

<style>
	h2 {
		view-transition-name: section;
	}
</style>
