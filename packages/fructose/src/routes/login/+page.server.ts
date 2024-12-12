import { graphql } from '$houdini';
import { mutationErrorMessages, mutationSucceeded } from '$lib/errors.js';
import { route } from '$lib/ROUTES.js';
import { error, fail, redirect } from '@sveltejs/kit';
import * as fg from 'formgator';
import { formgate } from 'formgator/sveltekit';

export const actions = {
	default: formgate(
		{
			email: fg.email({ required: true }),
			password: fg.password({ required: true })
		},
		async (input, event) => {
			const result = await graphql(`
				mutation Login($email: String!, $password: String!) {
					login(email: $email, password: $password) {
						...MutationErrors
						... on NewSession {
							token
						}
					}
				}
			`).mutate(input, { event });

			if (!mutationSucceeded('login', result)) {
				return fail(400, {
					message: mutationErrorMessages('login', result).join('\n')
				});
			}

			event.cookies.set('token', result.data.login.token, { path: '/', httpOnly: false });
			redirect(300, route('/'));
		}
	)
};
