<script lang="ts">
	interface Props {
		value: string;
		/** minimum number of columns to show */
		cols?: number;
	}

	let { value = $bindable(), cols = 1 }: Props = $props();

	let rows = $derived(Math.max(cols, value.split('\n').length));
</script>

<textarea {rows} bind:value class="growable"></textarea>

<style>
	textarea {
		width: 100%;
		background-color: transparent;
		border: var(--border-block) solid var(--shy);
		border-radius: 20px;
		padding: 0.5rem 0.75rem;
		color: var(--fg);
		outline: none;
	}

	textarea:hover,
	textarea:focus-visible {
		border-color: var(--fg);
	}

	textarea:focus {
		border-color: var(--primary);
	}
</style>
