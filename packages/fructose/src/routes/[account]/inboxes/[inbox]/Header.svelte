<script lang="ts">
	import { fragment, graphql, type InboxHeader } from '$houdini';
	import ButtonInk from '$lib/components/ButtonInk.svelte';
	import Header from '$lib/components/Header.svelte';
	import IconMailboxType, { colorclass } from '$lib/components/IconMailboxType.svelte';
	import ModalOrDrawer from '$lib/components/ModalOrDrawer.svelte';
	import { onceLoaded } from '$lib/loading';
	import LoadingText from '$lib/LoadingText.svelte';

	const { inbox }: { inbox: InboxHeader } = $props();
	const Inbox = $derived(
		fragment(
			inbox,
			graphql(`
				fragment InboxHeader on Mailbox {
					name
					type
					main
				}
			`)
		)
	);
</script>

<ModalOrDrawer statebound></ModalOrDrawer>

<Header title={$Inbox?.name}>
	{#snippet avatar()}
		<div class="icon-circle {onceLoaded($Inbox.type, colorclass, '') || 'muted'}">
			<IconMailboxType type={$Inbox?.type} />
		</div>
	{/snippet}
    {#snippet subtitle()}
        <LoadingText value={$Inbox?.type} /> box
        <ButtonInk >Change</ButtonInk>
    {/snippet}
</Header>

<style>
	.icon-circle {
        font-size: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
		padding: 0.75em;
		border-radius: 50%;
		background-color: var(--bg, var(--bg2));
	}
</style>
