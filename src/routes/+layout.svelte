<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">Home</a>
	<a href="/plan">Plan</a>
	<a href="/rate">Confidence</a>
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
