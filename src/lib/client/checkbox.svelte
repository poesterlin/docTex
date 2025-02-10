<script>
	let { children, id, name } = $props();
</script>

<div class="flex gap-2">
	<input
		type="checkbox"
		{id}
        {name}
		class="peer relative mt-1 h-4 w-4 shrink-0 appearance-none rounded-sm border-2 border-blue-500 bg-white checked:border-0 checked:bg-blue-800"
	/>
	<label for={id}>
		{@render children()}
	</label>
	<svg
		class="absolute mt-1 hidden h-4 w-4 peer-checked:block"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="4"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<polyline points="20 6 9 17 4 12"></polyline>
	</svg>
</div>
