<script lang="ts">
	import type { MailboxType$options } from '$houdini';
	import IconTrash from '~icons/msl/delete-outline';
	import IconBox from '~icons/msl/markunread-mailbox-outline';
	import IconFeed from '~icons/msl/newsmode-outline';
	import IconSent from '~icons/msl/send-outline';
	import IconDrafts from '~icons/msl/edit-document-outline';
	import IconScreener from '~icons/msl/thumbs-up-down-outline';
	import { loaded, type MaybeLoading } from '$lib/loading';

	interface Props {
		type: MaybeLoading<MailboxType$options>;
		/** Don't add a color css class to the icon, let the parent decide the icon's color */
		inheritcolors?: boolean;
	}

	const { type, inheritcolors = false }: Props = $props();

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

	let colorclass = $derived.by(() => {
		if (!loaded(type)) return '';
		switch (type) {
			case 'TRASHBOX':
				return 'danger';
			case 'INBOX':
				return '';
			case 'FEED':
				return 'primary';
			case 'SENTBOX':
				return 'success';
			case 'DRAFTS':
				return 'warning';
			case 'SCREENER':
				return 'muted';
			default:
				return '';
		}
	});

	$inspect(Icon);
	$inspect(type);
</script>

<div class="mailbox-icon {inheritcolors ? '' : colorclass}">
	{#if Icon}
		<Icon />
	{/if}
</div>

<style>
	.mailbox-icon {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
