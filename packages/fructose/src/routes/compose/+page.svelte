<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { graphql, type SendMail$input } from '$houdini';
	import ButtonPrimary from '$lib/components/ButtonPrimary.svelte';
	import GrowableTextarea from '$lib/components/GrowableTextarea.svelte';
	import InputSelectOneRadios from '$lib/components/InputSelectOneRadios.svelte';
	import InputTextGhost from '$lib/components/InputTextGhost.svelte';
	import MaybeError from '$lib/components/MaybeError.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { route } from '$lib/ROUTES';
	import { toasts } from '$lib/toasts';
	import IconTo from '~icons/msl/arrow-right';
	import IconFrom from '~icons/msl/person-outline';
	import IconSubject from '~icons/msl/short-text';
	import { type PageData } from './$houdini';

	let { data }: { data: PageData } = $props();
	let { PageCompose } = $derived(data);
	let defaultAccountName = $derived($page.url.searchParams.get('as'));
	let defaultAccount = $derived.by(() => {
		return $PageCompose?.data?.accounts.find((a) => a.address === defaultAccountName);
	});

	let mail: SendMail$input = $state({
		// svelte-ignore state_referenced_locally
		from: defaultAccount?.address || '',
		to: $page.url.searchParams.get('to') || '',
		subject: '',
		body: ''
	});
	const Send = graphql(`
		mutation SendMail($from: EmailAddress!, $to: EmailAddress!, $subject: String!, $body: String!) {
			sendEmail(from: $from, to: $to, subject: $subject, body: $body) {
				...MutationErrors
				... on Address {
					id
				}
			}
		}
	`);
</script>

<MaybeError result={$PageCompose}>
	{#snippet children({ accounts })}
		<Submenu>
			<SubmenuItem label icon={IconFrom} subtext="Send mail as">
				<InputSelectOneRadios
					required
					label=""
					options={accounts.map((a) => a.address)}
					bind:value={mail.from}
				/>
			</SubmenuItem>
			<SubmenuItem label icon={IconTo} subtext="To">
				<InputTextGhost
					label="Send mail to"
					bind:value={mail.to}
					placeholder="someone@example.com"
				/>
			</SubmenuItem>
			<SubmenuItem icon={IconSubject} subtext="Subject">
				<InputTextGhost bind:value={mail.subject} label="Subject" placeholder="" />
			</SubmenuItem>
		</Submenu>
		<main>
			<GrowableTextarea cols={6} bind:value={mail.body} />
		</main>
		<section class="submit">
			<ButtonPrimary
				on:click={async () => {
					const results = await Send.mutate(mail);
					if (toasts.mutation(results, 'sendEmail', 'Email sent', 'Could not send email')) {
						await goto(route('/[account]', mail.from));
					}
				}}
			>
				Send
			</ButtonPrimary>
		</section>
	{/snippet}
</MaybeError>

<style>
	main {
		padding: 2rem;
	}
	.submit {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
	}
</style>
