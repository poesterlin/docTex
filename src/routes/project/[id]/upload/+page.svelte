<script lang="ts">
	import { enhance } from '$app/forms';
	import FileUpload from '$lib/client/file-upload.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="sticky top-0 z-10 mb-8 rounded-md bg-gray-700/25 p-4 text-3xl font-semibold text-white shadow backdrop-blur-md">Upload File</h1>

<form action="?/upload" method="POST" use:enhance enctype="multipart/form-data">
	<FileUpload name="file">Add Project File</FileUpload>

	<button
		type="submit"
		class="w-full rounded-md bg-gray-700 px-4 py-2 font-medium text-gray-300 shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
	>
		Upload
	</button>
</form>

{#if data.html}
	<section>
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
	form {
		margin: 4rem 0 0;
		display: block;
	}

	div.placeholder {
		width: max(20rem, 50%);
		margin: 7rem auto 0;
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
		margin: 7rem auto 0;
		padding: 1rem;
		border-radius: 1rem;
		border: 2px solid #374151;
		background: #f0eadc;
		color: black;

		:global(h1, h2, h3, h4, h5, p) {
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
		}
	}
</style>
