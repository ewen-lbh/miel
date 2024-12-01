<script lang="ts">
	import MaybeError from '$lib/components/MaybeError.svelte';
	import LoadingText from '$lib/LoadingText.svelte';
	import type { PageData } from './$houdini';
	const { data }: { data: PageData } = $props();
	const { PageEmail } = $derived(data);
</script>

<MaybeError result={$PageEmail}>
	{#snippet children({ email })}
		{#if !email}
			<p>Email introuvable</p>
		{:else}
			<small>From <LoadingText value={email.from.address}></LoadingText> </small>
			<LoadingText tag="h1" value={email.subject}></LoadingText>
			<div class="mail-content">
				{@html email.html}
			</div>
		{/if}
	{/snippet}
</MaybeError>
