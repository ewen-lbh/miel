<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { graphql, type CreateAccount$input } from '$houdini';
	import ButtonPrimary from '$lib/components/ButtonPrimary.svelte';
	import InputTextGhost from '$lib/components/InputTextGhost.svelte';
	import Submenu from '$lib/components/Submenu.svelte';
	import SubmenuItem from '$lib/components/SubmenuItem.svelte';
	import { route } from '$lib/ROUTES';
	import { toasts } from '$lib/toasts';
	import IconGmail from '~icons/logos/google-gmail';
	import IconServer from '~icons/msl/database-outline';
	import IconReceive from '~icons/msl/download';
	import IconPassword from '~icons/msl/lock-outline';
	import IconUsername from '~icons/msl/person-outline';
	import IconSend from '~icons/msl/send-outline';

	const CreateAccount = graphql(`
		mutation CreateAccount(
			$address: EmailAddress!
			$username: String!
			$password: String!
			$receiverHost: String!
			$receiverPort: Int!
			$senderHost: String!
			$senderPort: Int!
		) {
			upsertAccount(
				address: $address
				input: {
					name: $receiverHost
					receiver: {
						host: $receiverHost
						username: $username
						password: $password
						port: $receiverPort
						tls: true
					}
					sender: {
						host: $senderHost
						username: $username
						password: $password
						port: $senderPort
						tls: true
					}
				}
			) {
				...MutationErrors
				... on Account {
					emailAddress
				}
			}
		}
	`);

	let account: CreateAccount$input = $state({
		address: '',
		username: '',
		password: '',
		receiverHost: '',
		receiverPort: 993,
		senderHost: '',
		senderPort: 587
	});

	const ConnectGmailAccount = graphql(`
		mutation ConnectGoogleAccount($callback: URL!) {
			connectServerAccout(callback: $callback, host: Google) {
				...MutationErrors
				... on RedirectionError {
					url
				}
			}
		}
	`);

	$effect(() => {
		if (account.senderHost === '' && account.receiverHost !== '') {
			account.senderHost = account.receiverHost;
		}
	});
</script>

<div class="content">
	<Submenu>
		<SubmenuItem
			icon={IconGmail}
			clickable
			onclick={async () => {
				const connection = await ConnectGmailAccount.mutate({
					callback: new URL(route('/connect/google'), $page.url.origin)
				});
				if (connection.data?.connectServerAccout.__typename === 'RedirectionError') {
					window.location.href = connection.data?.connectServerAccout.url.toString();
				}

				toasts.mutation(connection, 'connectServerAccout', '', 'Could not connect account');
			}}
		>
			Add a Gmail account
		</SubmenuItem>
		<SubmenuItem label icon={IconServer} subtext="Your mail server">
			<InputTextGhost
				required
				label="Server"
				placeholder="mail.example.com"
				bind:value={account.receiverHost}
			/>
		</SubmenuItem>
		<SubmenuItem label icon={IconUsername} subtext="Your username">
			<InputTextGhost
				required
				label="Username"
				placeholder="me@example.com"
				bind:value={account.username}
			/>
		</SubmenuItem>
		<SubmenuItem label icon={IconPassword} subtext="Your password">
			<InputTextGhost
				required
				type="password"
				label="Password"
				placeholder=""
				bind:value={account.password}
			/>
		</SubmenuItem>

		<h2 class="typo-field-label">Receving emails</h2>
		<SubmenuItem icon={IconReceive} subtext="Hostname & port for your IMAP server">
			<div class="side-by-side">
				<InputTextGhost
					id="receiver-host"
					label="Server"
					placeholder="mail.example.com"
					bind:value={account.receiverHost}
				/>
				<code>:</code>
				<InputTextGhost
					type="number"
					label="Port"
					placeholder="port"
					bind:value={account.receiverPort}
				/>
			</div>
		</SubmenuItem>
		<h2 class="typo-field-label">Sending emails</h2>
		<SubmenuItem label icon={IconSend} subtext="Configuration for your SMTP server">
			<div class="side-by-side">
				<InputTextGhost
					id="receiver-host"
					label="Server"
					placeholder="mail.example.com"
					bind:value={account.receiverHost}
				/>
				<code>:</code>
				<InputTextGhost
					type="number"
					label="Port"
					placeholder="port"
					bind:value={account.receiverPort}
				/>
			</div>
		</SubmenuItem>
	</Submenu>
	<section class="submit">
		<ButtonPrimary
			on:click={async () => {
				const result = await CreateAccount.mutate({ ...account, address: account.username });
				if (toasts.mutation(result, 'upsertAccount', 'Account added', 'Could not add account')) {
					await goto(route('/[account]', result.data.upsertAccount.emailAddress));
				}
			}}
		>
			Add account
		</ButtonPrimary>
	</section>
</div>

<style>
	.content {
		padding: 0.5rem 2rem;
	}
	h2 {
		font-weight: bold;
		margin-top: 1rem;
	}

	.side-by-side {
		display: flex;
		gap: 1em;
		align-items: center;
	}

	.submit {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
	}
</style>
