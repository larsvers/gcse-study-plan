<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();

	/** @type {Record<string, string>} */
	const METHOD_LABELS = {
		Blurt: '✏️ Blurt',
		'Past Paper': '🗞️ Past Paper',
		Feynman: '🫧 Feynman',
		'Active Recall': '★ Active Recall'
	};
</script>

<svelte:head>
	<title>Plan — Stanley's GCSE Revision</title>
</svelte:head>

<h1>Revision Plan</h1>

<!-- Day tabs -->
<nav class="day-tabs">
	{#each data.days as day (day)}
		<a
			href={resolve(`/plan?day=${day.id}`)}
			class="tab"
			class:active={day.id === data.activeDay.id}
		>
			{day.label}
		</a>
	{/each}
</nav>

<!-- Focus blurb for the day -->
<p class="focus"><em>{data.activeDay.focus}</em></p>

<!-- Sessions -->
<div class="sessions">
	{#each data.sessions as session (session.id)}
		{#if session.isBreak}
			<!-- Break row -->
			<div class="break-row">
				<span class="time">{session.time ?? ''}</span>
				<span class="break-label">{session.task}</span>
			</div>
		{:else}
			<!-- Study session card -->
			<div class="session-card" class:done={session.done}>
				<div class="session-header">
					<span class="time">{session.time}</span>
					<span class="subject">{session.subject}</span>
					{#if session.method}
						<span class="method">{METHOD_LABELS[session.method] ?? session.method}</span>
					{/if}

					<!-- Done toggle -->
					<form method="POST" action="?/toggleDone" use:enhance class="done-form">
						<input type="hidden" name="id" value={session.id} />
						<label class="done-label">
							<input
								type="checkbox"
								checked={!!session.done}
								onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
							/>
							Done
						</label>
					</form>
				</div>

				<p class="task">{session.task}</p>

				<!-- Notes + time spent -->
				<form method="POST" action="?/saveSession" use:enhance class="save-form">
					<input type="hidden" name="id" value={session.id} />
					<div class="form-row">
						<label>
							What I actually did
							<textarea name="notes" rows="3">{session.notes ?? ''}</textarea>
						</label>
					</div>
					<div class="form-row form-row-inline">
						<label>
							Time spent (min)
							<input
								type="number"
								name="time_spent"
								value={session.timeSpent ?? ''}
								min="0"
								max="120"
								style="width: 5rem"
							/>
						</label>
						<button type="submit">Save</button>
					</div>
				</form>

				<!-- Image upload -->
				<form
					method="POST"
					action="?/uploadImage"
					enctype="multipart/form-data"
					use:enhance
					class="upload-form"
				>
					<input type="hidden" name="id" value={session.id} />
					<label>
						Upload image
						<input
							type="file"
							name="image"
							accept="image/*"
							onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
						/>
					</label>
				</form>

				{#if session.imagePath}
					<div class="image-preview">
						<img src={session.imagePath} alt="Work for this session" />
					</div>
				{/if}
			</div>
		{/if}
	{/each}
</div>

<style>
	.day-tabs {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}
	.tab {
		padding: 0.4rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		text-decoration: none;
		color: var(--text-muted);
		background: var(--card);
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.15s;
	}
	.tab:hover {
		border-color: var(--accent);
		color: var(--accent-dark);
		text-decoration: none;
	}
	.tab.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.focus {
		color: var(--text-muted);
		margin-bottom: 1.25rem;
	}
	.sessions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.break-row {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 1rem;
		color: var(--text-muted);
		font-style: italic;
		font-size: 0.85rem;
		border-left: 3px solid var(--border);
	}
	.session-card {
		background: var(--card);
		border: 1px solid var(--border);
		padding: 1rem 1.25rem;
		border-radius: var(--radius);
		transition: opacity 0.2s;
	}
	.session-card.done {
		opacity: 0.5;
	}
	.session-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}
	.time {
		font-weight: 700;
		min-width: 3.5rem;
		color: var(--accent-dark);
	}
	.subject {
		font-weight: 600;
		font-size: 1.05rem;
	}
	.method {
		font-size: 0.78rem;
		padding: 0.2rem 0.6rem;
		background: color-mix(in srgb, var(--accent) 25%, transparent);
		border-radius: 4px;
		color: var(--accent-dark);
		font-weight: 500;
	}
	.done-form {
		margin-left: auto;
	}
	.done-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.task {
		margin: 0 0 0.75rem;
		color: var(--text);
		line-height: 1.5;
	}
	.save-form,
	.upload-form {
		margin-top: 0.5rem;
	}
	.form-row {
		margin-bottom: 0.5rem;
	}
	.form-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.form-row-inline {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
	}
	.form-row-inline label {
		flex-direction: row;
		align-items: center;
	}
	textarea {
		width: 100%;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 0.5rem;
		box-sizing: border-box;
		resize: vertical;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg);
		color: var(--text);
	}
	textarea:focus,
	input[type='number']:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
	}
	input[type='number'] {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.35rem 0.5rem;
		background: var(--bg);
		color: var(--text);
	}
	button[type='submit'] {
		padding: 0.4rem 1rem;
		cursor: pointer;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		transition: background 0.15s;
	}
	button[type='submit']:hover {
		background: var(--accent-dark);
	}
	.upload-form label {
		font-size: 0.85rem;
		color: var(--text-muted);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.image-preview {
		margin-top: 0.75rem;
	}
	.image-preview img {
		max-width: 100%;
		max-height: 300px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
</style>
