<script>
	import { resolve } from '$app/paths';
	let { children } = $props();
</script>

<nav>
	<a href={resolve('/')}>Home</a>
	<a href={resolve('/plan')}>Plan</a>
	<a href={resolve('/rate')}>Confidence</a>
</nav>

<main>
	{@render children()}
</main>

<style>
	nav {
		padding: 1rem;
		border-bottom: 1px solid #ccc;
		display: flex;
		gap: 1.5rem;
	}
	main {
		padding: 1.5rem;
		max-width: 900px;
	}
</style>
