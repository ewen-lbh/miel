import { graphql } from '$houdini';
import { mutationErrorMessages, mutationSucceeded } from '$lib/errors.js';
import { route } from '$lib/ROUTES.js';
import { fail, redirect } from '@sveltejs/kit';
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
				mutation Signup($email: String!, $password: String!) {
					signup(email: $email, password: $password) {
						...MutationErrors
						... on NewSession {
							token
						}
					}
				}
			`).mutate(input, { event });

			if (!mutationSucceeded('signup', result)) {
				return fail(400, {
					message: mutationErrorMessages('signup', result).join('\n')
				});
			}

			event.cookies.set('token', result.data.signup.token, { path: '/', httpOnly: false });
			redirect(300, route('/'));
		}
	)
};
