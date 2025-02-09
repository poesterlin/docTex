<script lang="ts">
	import { enhance } from '$app/forms';
	import FileUpload from '$lib/client/file-upload.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let replacedFile = $derived(data.files?.filter((file) => file.project_files));
</script>

<h1 class="sticky top-0 z-10 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">
	Project Files
</h1>

{#if replacedFile?.length}
	<h3 class="mb-4 mt-12">Uploaded Files</h3>
	<ul class="space-y-2 divide-y divide-gray-700">
		{#each replacedFile as file}
			<li class="flex items-center justify-between gap-4 rounded-md bg-gray-800 p-4 text-white shadow">
				<h4>{file.required_files.name}</h4>

				<!-- reset overwritten file -->
				<form action="?/reset" method="POST" use:enhance class="inline-block">
					<input type="hidden" name="fileId" value={file.project_files?.id} />
					<button type="submit" class="text-red-600 hover:text-red-400">Reset to Original</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}

<details class="m-auto mt-12 w-full max-w-lg " open>
	<summary class="mb-4">Upload Project File</summary>

	<form action="?/upload" method="POST" use:enhance enctype="multipart/form-data" class="block pb-20">
		<FileUpload name="file">Add Project File</FileUpload>

		{#if data.files?.length}
			<label for="replaceFile" class="mb-2 mt-2 block text-sm font-medium text-gray-300">Replace File:</label>
			<select
				name="replaceFile"
				id="replaceFile"
				class="mb-4 w-full rounded-md bg-gray-700 px-4 py-2 font-medium text-gray-300 shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
			>
				<option selected class="bg-gray-700 text-white" value="">Main Project File</option>
				{#each data.files as file}
					<option value={file.required_files.id} class="bg-gray-700 text-white">{file.required_files.name}</option>
				{/each}
			</select>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-gray-700 px-4 py-2 font-medium text-gray-300 shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
		>
			Upload
		</button>
	</form>
</details>

{#if data.html}
	<section class="mb-12">
		<h2>Project File</h2>
		<div class="md">
			{@html data.html}
		</div>
	</section>
{:else}
	<div class="placeholder">
		<span>No Project File yet.</span>
		<p aria-hidden="true">
			{Array.from({ length: 1000 })
				.map(() => ~~(Math.random() * 2))
				.join('')}
		</p>
	</div>
{/if}

<style>
	div.placeholder {
		width: max(20rem, 50%);
		margin: 1rem auto 0;
		min-height: 24rem;
		background: linear-gradient(360deg, #000000, #585858, #5d5d5d, #444);
		border-radius: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		overflow: hidden;
		border: 8px solid #374151;
		opacity: 0.8;

		span {
			font-size: 1.5rem;
			font-weight: 500;
			color: #ddd;
		}

		p {
			user-select: none;
			pointer-events: none;
			position: absolute;
			inset: 0;
			filter: blur(7px);
			word-wrap: break-word;
			white-space: pre-wrap;
			letter-spacing: 2px;
			font-size: 24px;
			translate: 5px -1.5rem;
			line-height: 1.2rem;
		}
	}

	section {
		margin: 1rem auto 10rem;
		padding: 1rem;
		border-radius: 1rem;
		border: 2px solid #374151;
		background: #f0eadc;
		color: black;

		:global(h1, h2, h3, h4, h5, p, pre, code) {
			all: revert-layer;
		}

		h2 {
			border-radius: 0.5rem;
			padding: 0.5rem 1rem;
			margin-top: 0px;
			background: #222;
			color: #ddd;
		}

		:global(pre) {
			font-size: 1rem;
			font-weight: 400;
			color: #ddd;
			background: #363636;
			padding: 1rem;
			border-radius: 0.5rem;
			white-space: pre-wrap;
		}
	}
</style>
