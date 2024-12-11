<script lang="ts">
	import { page } from '$app/stores';
	import { fragment, graphql, type EmailRow } from '$houdini';
	import Avatar from '$lib/components/Avatar.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { formatDateTimeSmart } from '$lib/dates';
	import { countThing } from '$lib/i18n';
	import { loading, LoadingText, mapAllLoading } from '$lib/loading';
	import { refroute } from '$lib/navigation';
	import { safeValue } from '$lib/typing';

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
					attachments {
						totalCount
					}
				}
			`)
		)
	);

	const {
		id,
		receivedAt,
		spamLevel,
		subject,
		from,
		attachments: { totalCount: attachmentsCount }
	} = $derived(
		$Email ?? {
			id: null,
			receivedAt: null,
			spamLevel: null,
			subject: null,
			from: null,
			attachments: { totalCount: 0 }
		}
	);
</script>

<SubmenuItem
	href={refroute('/[account]/[mail]', {
		account: $page.params.account,
		mail: loading(id, '')
	})}
>
	{#snippet icon()}
		{#if !noavatar}
			<Avatar address={from}></Avatar>
		{/if}
	{/snippet}
	{#snippet subtext()}
		<LoadingText
			value={mapAllLoading(
				[receivedAt, spamLevel?.at(0) ?? null, attachmentsCount],
				(date, lvl, count) =>
					[
						safeValue(() => formatDateTimeSmart(date)),
						lvl ? `Spam: ${lvl}` : null,
						count ? countThing('attachment', count) : null
					]
						.filter(Boolean)
						.join(' · ')
			)}
		/>
	{/snippet}
	<LoadingText value={subject} />
</SubmenuItem>
