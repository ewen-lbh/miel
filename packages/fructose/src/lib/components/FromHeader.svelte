<script lang="ts">
	import {
		fragment,
		graphql,
		type FromHeader,
		type FromHeader$data,
		type FromHeader_Inboxes
	} from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import Header from '$lib/components/Header.svelte';
	import IconMailboxType from '$lib/components/IconMailboxType.svelte';
	import InputSelectOneRadios from '$lib/components/InputSelectOneRadios.svelte';
	import ModalOrDrawer from '$lib/components/ModalOrDrawer.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { allLoaded, LoadingText, type MaybeLoading } from '$lib/loading';
	import { toasts } from '$lib/toasts';
	import { tooltip } from '$lib/tooltip';
	import IconChevronDown from '~icons/msl/arrow-drop-down';

	interface Props {
		address: FromHeader | null;
		account: FromHeader_Inboxes | null;
		linkify?: boolean;
		title: (d: FromHeader$data) => MaybeLoading<string | undefined>;
		subtitle?: (d: FromHeader$data) => MaybeLoading<string | undefined>;
	}

	let { address, title, subtitle, linkify, account }: Props = $props();
	const Address = $derived(
		fragment(
			address,
			graphql(`
				fragment FromHeader on Address {
					name
					address
					defaultInbox {
						id
						type
						name
					}
					...Avatar
				}
			`)
		)
	);

	const Account = $derived(
		fragment(
			account,
			graphql(`
				fragment FromHeader_Inboxes on Account {
					inboxes {
						id
						type
						name
					}
				}
			`)
		)
	);

	const ChangeDefaultInbox = graphql(`
		mutation ChangeDefaultInbox($address: EmailAddress!, $inbox: ID!) {
			upsertAddress(email: $address, input: { defaultInbox: $inbox }) {
				...MutationErrors
				... on Address {
					id
					defaultInbox {
						id
					}
				}
			}
		}
	`);

	let changeDefaultInbox: () => void = $state(() => {});
</script>

<ModalOrDrawer tall bind:open={changeDefaultInbox} title="Change default inbox">
	<Submenu>
		{#each $Account?.inboxes ?? [] as inbox}
			<SubmenuItem
				clickable
				onclick={async () => {
					if (!$Address?.address) return;
					if (inbox.id === $Address.defaultInbox?.id) return;
					const result = await ChangeDefaultInbox.mutate({
						address: $Address.address,
						inbox: inbox.id
					});
					toasts.mutation(result, 'upsertAddress', '', 'Could not change default inbox');
				}}
			>
				{#snippet icon()}
					<IconMailboxType type={inbox.type} />
				{/snippet}
				{inbox.name ?? '(Unnamed)'}
			</SubmenuItem>
		{/each}
	</Submenu>
</ModalOrDrawer>

<Header
	title={$Address?.name ?? ($Address && allLoaded($Address) ? title($Address) : '')}
	subtitle={$Address?.address ?? ($Address && allLoaded($Address) ? subtitle?.($Address) : '')}
>
	{#snippet avatar()}
		<Avatar {linkify} address={$Address} />
	{/snippet}
	{#if $Address?.defaultInbox}
		<section class="default-inbox">
			Put emails in
			{#if !allLoaded($Address.defaultInbox)}
				<LoadingText>.. loading</LoadingText>
			{:else}
				<button
					onclick={(e) => {
						e.preventDefault();
						changeDefaultInbox();
					}}
					class="in-body"
					use:tooltip={'Change default inbox'}
				>
					<IconMailboxType type={$Address.defaultInbox.type} />
					{$Address.defaultInbox.name}
					<IconChevronDown />
				</button>
			{/if}
		</section>
	{/if}
</Header>

<style>
	.default-inbox,
	.default-inbox button {
		display: flex;
		align-items: center;
		gap: 1ch;
		border-bottom: 1px solid transparent;
	}

	.default-inbox button {
		cursor: pointer;
	}

	.default-inbox button:is(:hover, :focus-visible) {
		border-color: var(--primary);
	}
</style>
