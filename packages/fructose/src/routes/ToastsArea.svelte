<script lang="ts">
	import { browser } from '$app/environment';
	import Toast from '$lib/components/Toast.svelte';
	import { toasts } from '$lib/toasts';
</script>

{#if browser}
	<section class="toasts">
		{#each $toasts as toast (toast.id)}
			<Toast
				on:action={async () => {
					if (toast.callbacks.action) await toast.callbacks.action(toast);
				}}
				action={toast.labels.action}
				closeLabel={toast.labels.close}
				{...toast}
			></Toast>
		{/each}
	</section>
{/if}

<style>
	section.toasts {
		position: fixed;
		bottom: 75px;
		left: 50%;
		z-index: 2000;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 600px;
		padding: 0 1rem;
		transform: translateX(-50%);
	}
	@media (min-width: 1000px) {
		section.toasts {
			right: 0;
			bottom: 6rem;
			left: unset;
			max-width: 700px;
			padding: 0 2rem 0 0;
			transform: unset;
		}
	}
</style>
