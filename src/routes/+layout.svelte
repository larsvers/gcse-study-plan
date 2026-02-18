<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();
</script>

<nav>
	<span class="brand">GCSE Revision</span>
	<div class="links">
		<a href={resolve('/')} class:active={page.url.pathname === '/'}>Home</a>
		<a href={resolve('/plan')} class:active={page.url.pathname.startsWith('/plan')}>Plan</a>
		<a href={resolve('/rate')} class:active={page.url.pathname.startsWith('/rate')}>Confidence</a>
	</div>
</nav>

<main>
	{@render children()}
</main>

<style>
	nav {
		background: var(--card);
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		gap: 2rem;
	}
	.brand {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--accent-dark);
	}
	.links {
		display: flex;
		gap: 0.25rem;
	}
	.links a {
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-muted);
		transition: background 0.15s;
	}
	.links a:hover {
		background: var(--border);
		text-decoration: none;
	}
	.links a.active {
		background: var(--accent);
		color: #fff;
	}
	main {
		padding: 1.5rem;
		max-width: 900px;
		margin: 0 auto;
	}
</style>
