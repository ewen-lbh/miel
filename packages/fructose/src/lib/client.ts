import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { ClientPlugin } from '$houdini';
import { HoudiniClient, subscription } from '$houdini';
import { parse } from 'cookie';
import { createClient } from 'graphql-ws';

const logger: ClientPlugin = () => ({
	start(ctx, { next }) {
		// add the start time to the context's stuff
		ctx.metadata = {
			...ctx.metadata,
			queryTimestamps: {
				global: Date.now(),
				network: 0
			}
		};

		// move onto the next plugin
		next(ctx);
	},
	beforeNetwork(ctx, { next }) {
		console.info(`${ctx.name}: Hitting network`);
		if (ctx.metadata?.queryTimestamps) ctx.metadata.queryTimestamps.network = Date.now();

		next(ctx);
	},
	afterNetwork(ctx, { resolve }) {
		if (ctx.metadata) {
			console.info(
				`${ctx.name}: Hitting network: took ${Date.now() - ctx.metadata.queryTimestamps.network}ms`
			);
		}
		resolve(ctx);
	},
	end(ctx, { resolve }) {
		// compute the difference in time between the
		// date we created on `start` and now
		if (ctx.metadata) {
			// const diff = Math.abs(Date.now() - ctx.metadata.queryTimestamps.global);
			// console.info(`[${ctx.session?.token ?? 'loggedout'}] ${ctx.name}: took ${diff}ms`);
		}

		// we're done
		resolve(ctx);
	}
});

const subscriptionPlugin = subscription(({ session }) =>
	createClient({
		url: env.PUBLIC_API_WEBSOCKET_URL,
		connectionParams() {
			return {
				token: `Bearer ${session?.token}`
			};
		}
	})
);

export default new HoudiniClient({
	url: env.PUBLIC_API_URL,
	plugins: [logger, subscriptionPlugin],
	fetchParams({ session }) {
		const cookies = browser ? parse(document.cookie) : {};
		const token = session?.token ?? cookies.token;
		return {
			credentials: 'include',
			headers: {
				Authorization: token ? `Bearer ${token}` : ''
			}
		};
	}
});
