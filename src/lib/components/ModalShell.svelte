<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		onclose: () => void;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let { open, title, children, onclose, onkeydown }: Props = $props();
	let dialog = $state<HTMLDialogElement>();
	const titleId = $props.id();
	let returnFocus: HTMLElement | null = null;

	$effect(() => {
		if (!dialog) return;

		if (open && !dialog.open) {
			const activeElement = document.activeElement;
			returnFocus = activeElement instanceof HTMLElement ? activeElement : null;
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	function handleClose() {
		if (dialog?.open) return;

		onclose();
		if (returnFocus?.isConnected) {
			returnFocus.focus({ preventScroll: true });
		}
		returnFocus = null;
	}
</script>

<dialog bind:this={dialog} aria-labelledby={titleId} onclose={handleClose} {onkeydown}>
	<header>
		<h2 id={titleId}>{title}</h2>
		<form method="dialog">
			<button type="submit">Close</button>
		</form>
	</header>
	{@render children()}
</dialog>

<style>
	dialog {
		--dialog-border: rgb(229 210 184 / 21%);
		color: #f4eadc;
		background: #171410;
		border: 1px solid var(--dialog-border);
		box-shadow: 0 1.5rem 6rem rgb(0 0 0 / 65%);
		width: min(72rem, calc(100% - clamp(1rem, 6vw, 6rem)));
		max-width: none;
		max-height: calc(100% - clamp(1rem, 6vh, 4rem));
		margin: auto;
		padding: 0;
		overscroll-behavior: contain;
	}

	dialog::backdrop {
		background: rgb(10 8 7 / 84%);
		backdrop-filter: blur(8px);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.65rem clamp(1rem, 3vw, 2rem);
		border-bottom: 1px solid var(--dialog-border);
	}

	h2 {
		margin: 0;
		font: inherit;
		font-size: clamp(1rem, 2vw, 1.25rem);
		font-weight: 500;
		line-height: 1.3;
	}

	button {
		min-height: 2.75rem;
		font: inherit;
		font-size: 0.875rem;
		color: inherit;
		background: transparent;
		border: 1px solid var(--dialog-border);
		padding: 0.4rem 0.85rem;
		cursor: pointer;
		white-space: nowrap;
	}

	button:hover {
		background: #2d261e;
	}

	button:focus-visible {
		outline: 2px solid #e3b98b;
		outline-offset: 2px;
	}
</style>
