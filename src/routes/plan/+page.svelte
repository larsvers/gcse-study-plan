<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();

	/** @type {Record<number, 'sending' | 'sent'>} */
	let uploadStatus = $state({});

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

					<!-- Confidence rating -->
					<form method="POST" action="?/saveConfidence" use:enhance class="confidence-form">
						<input type="hidden" name="id" value={session.id} />
						<label class="confidence-label"
							>Rate
							<select
								name="confidence"
								class="confidence-select"
								class:c1={session.confidence === 1}
								class:c2={session.confidence === 2}
								class:c3={session.confidence === 3}
								class:c4={session.confidence === 4}
								class:c5={session.confidence === 5}
								onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
							>
								<option value="">—</option>
								<option value="1" selected={session.confidence === 1}>1</option>
								<option value="2" selected={session.confidence === 2}>2</option>
								<option value="3" selected={session.confidence === 3}>3</option>
								<option value="4" selected={session.confidence === 4}>4</option>
								<option value="5" selected={session.confidence === 5}>5</option>
							</select>
						</label>
					</form>

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
					use:enhance={() => {
						uploadStatus[session.id] = 'sending';
						return async ({ update }) => {
							uploadStatus[session.id] = 'sent';
							await update();
						};
					}}
					class="upload-row"
				>
					<input type="hidden" name="id" value={session.id} />
					<label class="upload-btn">
						{#if uploadStatus[session.id] === 'sending'}
							Sending…
						{:else if uploadStatus[session.id] === 'sent' || session.imageSent}
							✓ Sent!
						{:else}
							📎 Upload image
						{/if}
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
	.confidence-form {
		margin-left: auto;
	}
	.confidence-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		color: var(--text-muted);
		cursor: pointer;
	}
	.confidence-select {
		width: 3rem;
		text-align: center;
		font-size: 0.9rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.2rem;
		cursor: pointer;
		background: var(--bg);
		color: var(--text);
		transition: border-color 0.15s;
	}
	.confidence-select:focus {
		outline: none;
		border-color: var(--accent);
	}
	.confidence-select.c1 {
		background: #4a1c1c;
		border-color: #8b3a3a;
		color: #f5a5a5;
	}
	.confidence-select.c2 {
		background: #4a3a0e;
		border-color: #8b7020;
		color: #f0d060;
	}
	.confidence-select.c3 {
		background: #3a3a0e;
		border-color: #7a7a20;
		color: #d0d060;
	}
	.confidence-select.c4 {
		background: #1a3a24;
		border-color: #3b7a4f;
		color: #7bc88f;
	}
	.confidence-select.c5 {
		background: #0e3a2a;
		border-color: #2a8a5a;
		color: #50e090;
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
	.save-form {
		margin-top: 0.5rem;
	}
	.upload-row {
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.upload-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.9rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.upload-btn:hover {
		border-color: var(--accent);
		color: var(--accent-dark);
	}
	.upload-btn input[type='file'] {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.form-row {
		margin-bottom: 0.9rem;
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
