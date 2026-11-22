<script module lang="ts">
	export interface GalleryItem {
		src: string;
		alt: string;
		caption?: string;
		credit?: string;
		width?: number;
		height?: number;
	}
</script>

<script lang="ts">
	import ModalShell from './ModalShell.svelte';

	interface Props {
		items: readonly GalleryItem[];
		index?: number | null;
		title?: string;
	}

	let { items, index = $bindable(null), title = 'Photo gallery' }: Props = $props();
	const item = $derived(index === null ? undefined : items[index]);

	function move(direction: -1 | 1) {
		if (index === null || items.length < 2) return;
		index = (index + direction + items.length) % items.length;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey || items.length < 2) return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			move(-1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			move(1);
		}
	}
</script>

<ModalShell open={item !== undefined} {title} onclose={() => (index = null)} onkeydown={handleKeydown}>
	{#if item && index !== null}
		<figure>
			<div class="photo">
				<img src={item.src} alt={item.alt} width={item.width} height={item.height} />
			</div>
			{#if item.caption || item.credit}
				<figcaption>
					{#if item.caption}<span>{item.caption}</span>{/if}
					{#if item.credit}<span class="credit">{item.credit}</span>{/if}
				</figcaption>
			{/if}
		</figure>

		<div class="toolbar">
			{#if items.length > 1}
				<button type="button" onclick={() => move(-1)} aria-label="Previous photo">Previous</button>
			{/if}
			<span aria-live="polite" aria-atomic="true">
				{index + 1} of {items.length}
			</span>
			{#if items.length > 1}
				<button type="button" onclick={() => move(1)} aria-label="Next photo">Next</button>
			{/if}
		</div>
	{/if}
</ModalShell>

<style>
	figure {
		margin: 0;
	}

	.photo {
		display: grid;
		place-items: center;
		background: #080706;
		height: min(60svh, 52rem);
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		object-fit: contain;
	}

	figcaption,
	.toolbar {
		padding-inline: clamp(0.8rem, 3vw, 2rem);
	}

	figcaption {
		display: flex;
		justify-content: space-between;
		gap: 0.2rem 1.5rem;
		flex-wrap: wrap;
		padding-block-start: 0.9rem;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.credit {
		color: #c1ad96;
		font-size: 0.875rem;
	}

	.toolbar {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding-block: 0.8rem;
		font-size: 0.875rem;
		color: #c1ad96;
	}

	button {
		min-height: 2.75rem;
		font: inherit;
		color: #f4eadc;
		background: transparent;
		border: 1px solid rgb(229 210 184 / 21%);
		padding: 0.45rem 0.85rem;
		cursor: pointer;
	}

	button:hover {
		background: #2d261e;
	}

	button:focus-visible {
		outline: 2px solid #e3b98b;
		outline-offset: 2px;
	}
</style>
