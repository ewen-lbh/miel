import { graphql, load_PageInbox, load_PageInboxUnrolled } from '$houdini';
import { error } from '@sveltejs/kit';

const NeedsUnroll = graphql(`
	query PageInboxNeedsUnrolling($account: EmailAddress!, $inbox: ID!) {
		account(address: $account) {
			inbox(id: $inbox) {
				...InboxHeader
				type
			}
		}
	}
`);

graphql(`
	query PageInbox($account: EmailAddress!, $inbox: ID!) @loading(cascade: true) {
		account(address: $account) {
			inbox(id: $inbox) {
				...InboxHeader
				id
				name
				type
				emails(first: 50) @paginate @loading(count: 5) {
					edges {
						node {
							...EmailRow
						}
					}
				}
			}
		}
	}
`);

graphql(`
	query PageInboxUnrolled($account: EmailAddress!, $inbox: ID!) @loading(cascade: true) {
		account(address: $account) {
			inbox(id: $inbox) {
				id
				name
				type
				emails(first: 3) @paginate @loading(count: 5) {
					edges {
						node {
							...EmailRow
							...MailBody
						}
					}
				}
			}
		}
	}
`);

export async function load(event) {
	const needsunroll = await NeedsUnroll.fetch({
		variables: event.params,
		event
	});

	if (needsunroll.errors) {
		error(500, { message: needsunroll.errors.map((e) => e.message).join(', ') });
	}

	if (!needsunroll.data?.account?.inbox) {
		error(404, { message: 'Inbox not found' });
	}

	return needsunroll.data.account.inbox.type === 'Feed'
		? load_PageInboxUnrolled({ event, variables: event.params })
		: load_PageInbox({ event, variables: event.params });
}
