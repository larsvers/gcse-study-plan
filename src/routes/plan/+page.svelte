<script>
	import { enhance } from '$app/forms';

	let { data } = $props();

	/** @type {Record<string, string>} */
	const METHOD_LABELS = {
		Blurt: '⁂ Blurt',
		'Past Paper': '◉ Past Paper',
		Feynman: '⚙ Feynman',
		'Active Recall': '★ Active Recall'
	};
</script>

<svelte:head>
	<title>Plan — Stanley's GCSE Revision</title>
</svelte:head>

<h1>Revision Plan</h1>

<!-- Day tabs -->
<nav class="day-tabs">
	{#each data.days as day}
		<a
			href="/plan?day={day.id}"
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
					<form
						method="POST"
						action="?/toggleDone"
						use:enhance
						class="done-form"
					>
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
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}
	.tab {
		padding: 0.4rem 0.8rem;
		border: 1px solid #999;
		text-decoration: none;
		color: inherit;
	}
	.tab.active {
		background: #1a3a5c;
		color: white;
		border-color: #1a3a5c;
	}
	.focus {
		color: #555;
		margin-bottom: 1.5rem;
	}
	.sessions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.break-row {
		display: flex;
		gap: 1rem;
		padding: 0.4rem 0;
		color: #777;
		font-style: italic;
		font-size: 0.9rem;
	}
	.session-card {
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 4px;
	}
	.session-card.done {
		opacity: 0.6;
		background: #f9f9f9;
	}
	.session-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}
	.time {
		font-weight: bold;
		min-width: 3.5rem;
	}
	.subject {
		font-weight: bold;
		font-size: 1.05rem;
	}
	.method {
		font-size: 0.8rem;
		padding: 0.15rem 0.5rem;
		background: #e8f0fe;
		border-radius: 3px;
		color: #1a3a5c;
	}
	.done-form {
		margin-left: auto;
	}
	.done-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.task {
		margin: 0 0 0.75rem;
		color: #333;
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
		color: #555;
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
		padding: 0.4rem;
		box-sizing: border-box;
		resize: vertical;
	}
	button[type='submit'] {
		padding: 0.35rem 0.9rem;
		cursor: pointer;
	}
	.upload-form label {
		font-size: 0.85rem;
		color: #555;
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
		border: 1px solid #ccc;
	}
</style>
