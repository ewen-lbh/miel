<script lang="ts" module>
	export const colorclass = (type: MailboxType$options) => {
		if (!loaded(type)) return '';
		switch (type) {
			case 'Trash':
				return 'danger';
			case 'Inbox':
				return '';
			case 'Feed':
				return 'primary';
			case 'Sent':
				return 'success';
			case 'Drafts':
				return 'warning';
			default:
				return '';
		}
	};

	export const iconinstance = (type: MaybeLoading<MailboxType$options>): undefined | Component => {
		if (!loaded(type)) return null;
		switch (type) {
			case 'Trash':
				return IconTrash;
			case 'Inbox':
				return IconBox;
			case 'Feed':
				return IconFeed;
			case 'Sent':
				return IconSent;
			case 'Drafts':
				return IconDrafts;
			default:
				return null;
		}
	};
</script>

<script lang="ts">
	import type { MailboxType$options } from '$houdini';
	import { loaded, onceLoaded, type MaybeLoading } from '$lib/loading';
	import type { Component } from 'svelte';
	import IconTrash from '~icons/msl/delete-outline';
	import IconDrafts from '~icons/msl/edit-document-outline';
	import IconBox from '~icons/msl/markunread-mailbox-outline';
	import IconFeed from '~icons/msl/newsmode-outline';
	import IconSent from '~icons/msl/send-outline';

	interface Props {
		type: MaybeLoading<MailboxType$options>;
		/** Don't add a color css class to the icon, let the parent decide the icon's color */
		inheritcolors?: boolean;
	}

	const { type, inheritcolors = false }: Props = $props();
	let Icon = $derived(iconinstance(type));
</script>

<div class="mailbox-icon {inheritcolors ? '' : onceLoaded(type, colorclass, '')}">
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
