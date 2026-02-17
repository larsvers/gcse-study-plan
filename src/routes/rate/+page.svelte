<script>
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<svelte:head>
	<title>Confidence Tracker — Stanley's GCSE Revision</title>
</svelte:head>

<h1>Confidence Tracker</h1>
<p>After each session, rate yourself: <strong>1</strong> = still shaky · <strong>2</strong> = getting there · <strong>3</strong> = solid</p>

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				<th>Subject</th>
				{#each data.days as day}
					<th>{day.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.subjects as subject}
				<tr>
					<td class="subject-cell">{subject}</td>
					{#each data.days as day}
						<td class="rating-cell">
							<form method="POST" action="?/saveRating" use:enhance>
								<input type="hidden" name="subject" value={subject} />
								<input type="hidden" name="day_id" value={day.id} />
								<select
									name="rating"
									onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
									class="rating-select"
									class:rated-1={data.ratingsMap[subject]?.[day.id] === 1}
									class:rated-2={data.ratingsMap[subject]?.[day.id] === 2}
									class:rated-3={data.ratingsMap[subject]?.[day.id] === 3}
								>
									<option value="">—</option>
									<option
										value="1"
										selected={data.ratingsMap[subject]?.[day.id] === 1}
									>1</option>
									<option
										value="2"
										selected={data.ratingsMap[subject]?.[day.id] === 2}
									>2</option>
									<option
										value="3"
										selected={data.ratingsMap[subject]?.[day.id] === 3}
									>3</option>
								</select>
							</form>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		min-width: 500px;
	}
	th,
	td {
		border: 1px solid #ccc;
		padding: 0.5rem 0.75rem;
		text-align: center;
	}
	th {
		background: #1a3a5c;
		color: white;
		font-weight: normal;
		font-size: 0.85rem;
	}
	.subject-cell {
		text-align: left;
		white-space: nowrap;
	}
	.rating-cell {
		padding: 0.25rem;
	}
	.rating-select {
		width: 3.5rem;
		text-align: center;
		font-size: 1rem;
		border: 1px solid #ccc;
		padding: 0.2rem;
		cursor: pointer;
	}
	.rating-select.rated-1 {
		background: #fce4e4;
	}
	.rating-select.rated-2 {
		background: #fff3cd;
	}
	.rating-select.rated-3 {
		background: #d4edda;
	}
</style>
