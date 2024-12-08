<script lang="ts">
	import { fragment, graphql, type MailBody } from '$houdini';
	import UnwrappingIframe from '$lib/components/UnwrappingIframe.svelte';
	import { loaded, loading } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';

	interface Props {
		email: MailBody;
	}

	let { email }: Props = $props();
	let Email = $derived(
		fragment(
			email,
			graphql(`
				fragment MailBody on Email @loading {
					html
					text
					attachmentsBaseURL
				}
			`)
		)
	);
</script>

{#if $Email.html && loaded($Email.attachmentsBaseURL)}
	<UnwrappingIframe
		cidSourceUrlTemplate={(cid) => `${loading($Email.attachmentsBaseURL, '')}/${cid}`}
		html={$Email.html}
	/>
{:else}
	<main class="text main-content">
		{#if !loaded($Email.text)}
			<LoadingText lines={10} tag="p"></LoadingText>
		{:else}
			{#each $Email.text.split(/\r?\n/) as line}
				<p>{line}</p>
			{/each}
		{/if}
	</main>
{/if}

<style>
	.main-content.text {
		max-width: 800px;
		width: 100%;
		padding: 1rem;
		border-radius: var(--radius-block);
		background-color: var(--bg2);
	}
</style>
