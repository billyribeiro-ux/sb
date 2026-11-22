<script lang="ts">
	import ModalShell from './ModalShell.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		videoId?: string;
	}

	let {
		open = $bindable(false),
		title = 'Sergio Bellotti on film',
		videoId = 'VM3tfTmhZUI'
	}: Props = $props();

	const usableId = $derived(/^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null);
</script>

<ModalShell {open} {title} onclose={() => (open = false)}>
	{#if open}
		{#if usableId}
			<div class="screen">
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${usableId}?rel=0`}
					{title}
					allow="encrypted-media; picture-in-picture; fullscreen"
					allowfullscreen
					referrerpolicy="strict-origin-when-cross-origin"
				></iframe>
			</div>
			<footer>
				<a href={`https://www.youtube.com/watch?v=${usableId}`} target="_blank" rel="noopener noreferrer">
					Watch on YouTube
				</a>
			</footer>
		{:else}
			<p class="notice">This video is unavailable.</p>
		{/if}
	{/if}
</ModalShell>

<style>
	.screen {
		background: #080706;
		display: grid;
		place-items: center;
	}

	iframe {
		display: block;
		border: 0;
		width: min(100%, calc(70svh * 16 / 9));
		aspect-ratio: 16 / 9;
		max-height: 75svh;
	}

	footer,
	.notice {
		padding: 0.75rem clamp(1rem, 3vw, 2rem);
		margin: 0;
	}

	a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		color: #e3b98b;
		text-underline-offset: 0.22em;
	}

	a:hover {
		color: #f4eadc;
	}

	a:focus-visible {
		outline: 2px solid #e3b98b;
		outline-offset: 2px;
	}
</style>
