<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { graphql } from '$houdini';
	import { route } from '$lib/ROUTES';
	import { toasts } from '$lib/toasts';

	const FinishConnect = graphql(`
		mutation FinishGoogleConnection($code: String!, $callback: URL!) {
			connectServerAccout(code: $code, host: Google, callback: $callback) {
				...MutationErrors
				... on Account {
					emailAddress
				}
			}
		}
	`);

	$effect(async () => {
		const result = await FinishConnect.mutate({
			code: $page.url.searchParams.get('code') ?? '',
			callback: new URL($page.url.pathname, $page.url)
		});

		if (
			toasts.mutation(
				result,
				'connectServerAccout',
				'',
				'Could not finish connecting google account'
			)
		) {
			await goto(route('/[account]', result.data.connectServerAccout.emailAddress));
		}
	});
</script>
