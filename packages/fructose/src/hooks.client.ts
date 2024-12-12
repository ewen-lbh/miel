import { setSession } from '$houdini';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	setSession(event, { token: event.cookies.get('token') ?? null });
	await resolve(event);
};
