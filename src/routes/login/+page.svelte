<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<section class="flex flex-col items-center justify-center h-screen space-y-4">
	<h1 class="mb-4 text-3xl font-bold">Login</h1>

	<p class="text-gray-600 w-96 text-center">
		This application uses Google Drive as a Data store. Please login with your Google account to
		continue.
	</p>

	<form
		method="post"
		action="?/authenticate"
		use:enhance
		class="mt-8 flex max-w-sm flex-col space-y-4"
	>
		<button
			type="submit"
			class="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			<img src="/google.png" alt="Google Icon" class="mr-2 h-5 w-5" />
			Login with Google
		</button>
	</form>
</section>
