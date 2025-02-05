<script lang="ts">
	import { assert } from '$lib';
	import { IconFolderOpen } from '@tabler/icons-svelte';

	let { name, children }: { name: string; children: any } = $props();

	let fileName = $state('');
	let text = $state('');
	let dragging = $state(false);
	let fileEl: HTMLInputElement | null = null;
	const completed = $derived(!!text);

	const id = Math.random().toString(36).substring(2);

	function oninput(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.item(0);
		if (!file) {
			return;
		}

		readFile(file);
	}

	function readFile(file: File) {
		fileName = file.name;
		try {
			const reader = new FileReader();
			reader.onload = () => (text = limitToRows(reader.result as string, 10));
			reader.readAsText(file);
		} catch (error) {
			text = 'Your file is too big to be displayed here!';
		}
	}

	function limitToRows(text: string, rows: number) {
		return text.split('\n').slice(0, rows).join('\n') + '\n...';
	}

	function handleDrop(event: DragEvent) {
		dragging = false;
		event.preventDefault();
		const file = event.dataTransfer?.files?.item(0);
		if (!event.dataTransfer || !file) {
			return;
		}

		readFile(file);
		assert(fileEl);
		fileEl.remove();
		fileEl.files = event.dataTransfer.files; // Assign the files to the input
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}
</script>

<div role="region" ondrop={handleDrop} ondragover={handleDragOver} class:dragging ondragleave={handleDragLeave}>
	{#if fileName}
		<h2>{fileName}</h2>
	{/if}
	<pre>{text || 'Drop your File here!'}</pre>

	<div class="highlight"></div>

	<label
		for={id}
		class:completed
		class="w-full cursor-pointer rounded-md bg-gray-700 px-4 py-2 font-medium text-gray-300 shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
	>
		{@render children?.()}
		<IconFolderOpen />
		<input type="file" {name} {id} {oninput} required bind:this={fileEl} />
	</label>

</div>

<style>
	label {
		display: inline-block;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
		width: max-content;
		transition: background 0.3s;
	}

	input {
		appearance: none;
		position: absolute;
		width: 0;
		height: 0;
	}

	div {
		position: relative;
		margin-top: 1rem;
		overflow: hidden;
		margin-bottom: 0.3rem;

		h2 {
			padding: 0 1rem;
			display: flex;
			align-items: center;
			gap: 1rem;
			color: white;
			border-radius: 7px;
			justify-content: center;
			font-weight: bold;
			letter-spacing: 0.7px;
			transform: rotate3d(-0.5, 0.9, 1.8, 2.4deg);
			translate: 0 15px;
		}

		pre {
			width: 94%;
			border-top-left-radius: 1rem;
			border-top-right-radius: 1rem;
			background: #222;
			color: #ddd;
			white-space: pre-wrap;
			word-wrap: break-word;
			padding: 1rem;
			border: 0;
			transform: rotate3d(-1.5, 1, 1, 3deg) translateY(20px);
			margin: 0 auto;
			min-height: 200px;
			max-height: 20rem;
			position: relative;
			overflow: hidden;
			z-index: 1;
		}

		&::after {
			content: '';
			position: absolute;
			inset: -30px;
			background: linear-gradient(342deg, #0b2127 80%, transparent 98%);
			pointer-events: none;
			border-radius: 0.5rem;
			transform: rotateX(12deg) rotateY(21deg);
			translate: 9px 68px;
			scale: 0.9 1;
			opacity: 0.2;
		}

		label {
			position: absolute;
			inset: 0;
			translate: 0px 40px;
			height: 3rem;
			margin: auto;
			z-index: 2;
			box-shadow: -3px -2px 13px 1px #2f343d94;
			transform: rotate3d(-0.5, 0.9, 1.8, 3deg);
		}

		.highlight {
			position: absolute;
			left: -2.5rem;
			top: 2rem;
			width: 20rem;
			height: 12rem;
			z-index: 4;
			border-radius: 50%;
			filter: blur(23px);
			background: radial-gradient(#dbc183b0 25%, transparent 55%);
			opacity: 0.1;
			transition: opacity 0.5s;
		}

		/* drag styling */
		&.dragging .highlight {
			opacity: 0.5;
		}
	}
</style>
