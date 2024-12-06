<script lang="ts">
	import type { MailboxType$options } from '$houdini';
	import IconTrash from '~icons/msl/delete-outline';
	import IconBox from '~icons/msl/markunread-mailbox-outline';
	import IconFeed from '~icons/msl/newsmode-outline';
	import IconSent from '~icons/msl/send-outline';
	import IconDrafts from '~icons/msl/draft-orders-outline';
	import IconScreener from '~icons/msl/thumbs-up-down-outline';
	import { loaded, type MaybeLoading } from '$lib/loading';

	interface Props {
		type: MaybeLoading<MailboxType$options>;
	}

	const { type }: Props = $props();

	let Icon = $derived.by(() => {
		if (!loaded(type)) return null;
		switch (type) {
			case 'TRASHBOX':
				return IconTrash;
			case 'INBOX':
				return IconBox;
			case 'FEED':
				return IconFeed;
			case 'SENTBOX':
				return IconSent;
			case 'DRAFTS':
				return IconDrafts;
			case 'SCREENER':
				return IconScreener;
			default:
				return null;
		}
	});

	$inspect(Icon);
	$inspect(type);
</script>

{#if Icon}
	<Icon />
{/if}
