<script lang="ts">
	import { loaded, LoadingText, type MaybeLoading } from '$lib/loading';
	import type { Snippet } from 'svelte';

	interface Props {
		title: MaybeLoading<string | undefined> | Snippet<[]>;
		subtitle?: MaybeLoading<string | undefined> | Snippet<[]>;
		avatar?: Snippet<[]>;
		children?: Snippet<[]>;
	}

	let { title, subtitle, avatar, children }: Props = $props();
</script>

<header>
	<div class="avatar">
		{@render avatar?.()}
	</div>
	<div class="text">
		<h2>
			{#if !loaded(title)}
				<LoadingText />
			{:else if title instanceof Function}
				{@render title()}
			{:else}
				{title}
			{/if}
		</h2>
		<div class="subtitle">
			{#if !loaded(subtitle)}
				<LoadingText />
			{:else if subtitle instanceof Function}
				{@render subtitle()}
			{:else}
				{subtitle}
			{/if}
		</div>
	</div>
	<div class="rest">
		{@render children?.()}
	</div>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 1em 2em;
	}

	header .avatar {
		font-size: 3em;
		flex-shrink: 0;
	}

	header .rest {
		margin-left: auto;
	}
</style>
