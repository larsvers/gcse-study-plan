<script>
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Stanley's GCSE Revision</title>
</svelte:head>

<div class="hero">
	<h1>Stanley's GCSE Revision — Half Term 2026</h1>
	<p class="subtitle"><strong>18–21 February 2026</strong> · 4 sessions per day · 20 minutes each · real breaks · no heroics</p>
</div>

<div class="card">
	<h2>The Rules</h2>
	<ol>
		<li>Each session is 20 minutes. When the timer goes, you stop.</li>
		<li>Breaks are real breaks. Stand up. Walk around. Get a drink. Phone stays in another room during study blocks.</li>
		<li>You don't need to know everything. You need to practise the right things.</li>
		<li>After each session, rate your confidence 1–5 on the session card.</li>
		<li>If a session goes well, great. If it doesn't, also great — you've found what needs work.</li>
	</ol>
</div>

<div class="card">
	<h2>The Three Methods</h2>
	<dl>
		<dt>⁂ The Blurt</dt>
		<dd>Read a page or watch a short video (10 min max). Close it. Write down EVERYTHING you remember. Then check what you missed. The gaps are gold.</dd>

		<dt>◉ Past Paper Drill</dt>
		<dd>Pick ONE exam question. Attempt it without notes. Time yourself. Then check the mark scheme. Highlight what you missed and WHY.</dd>

		<dt>⚙ The Feynman</dt>
		<dd>Learn something, then explain it to Lars as if he knows nothing about it. If you can't explain it simply, you don't understand it yet.</dd>
	</dl>
</div>

<a href={resolve('/plan')} class="cta">→ Go to the Plan</a>

<style>
	.hero {
		margin-bottom: 1.5rem;
	}
	.subtitle {
		color: var(--text-muted);
	}
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.25rem 1.5rem;
		margin-bottom: 1rem;
	}
	.card h2 {
		margin-top: 0;
	}
	ol {
		padding-left: 1.25rem;
	}
	ol li {
		margin-bottom: 0.35rem;
	}
	dl {
		display: grid;
		gap: 0.75rem;
	}
	dt {
		font-weight: 600;
	}
	dd {
		margin-left: 0;
		color: var(--text-muted);
	}
	.cta {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.5rem 1.25rem;
		background: var(--accent);
		color: #fff;
		border-radius: 6px;
		font-weight: 600;
	}
	.cta:hover {
		background: var(--accent-dark);
		text-decoration: none;
	}
</style>
