<script lang="ts">
	import { page } from '$app/stores';
	import { fragment, graphql, PendingValue, type EmailRow } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { formatDateTimeSmart } from '$lib/dates';
	import { loading, LoadingText, mapLoading } from '$lib/loading';
	import { refroute } from '$lib/navigation';

	interface Props {
		email: EmailRow | null;
		noavatar?: boolean;
	}

	const { email, noavatar = false }: Props = $props();
	let Email = $derived(
		fragment(
			email,
			graphql(`
				fragment EmailRow on Email {
					id
					receivedAt
					spamLevel: header(key: "X-Spam-Level")
					subject
					from {
						name
						address
						...Avatar
					}
				}
			`)
		)
	);

	const { id, receivedAt, spamLevel, subject, from } = $derived(
		$Email ?? {
			id: null,
			receivedAt: null,
			spamLevel: null,
			subject: null,
			from: null
		}
	);
</script>

<SubmenuItem
	icon={null}
	href={refroute('/[account]/[mail]', {
		account: $page.params.account,
		mail: loading(id, '')
	})}
>
	<svelte:fragment slot="icon">
		{#if !noavatar}
			<Avatar address={from}></Avatar>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="subtext">
		<LoadingText value={mapLoading(receivedAt, formatDateTimeSmart)}></LoadingText>
		<LoadingText
			value={mapLoading(spamLevel?.at(0) ?? null, (lvl) => (lvl ? ` · Spam level: ${lvl}` : ''))}
		/>
	</svelte:fragment>
	<LoadingText value={subject} />
</SubmenuItem>
