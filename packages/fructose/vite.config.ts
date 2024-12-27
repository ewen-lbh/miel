import { sveltekit } from '@sveltejs/kit/vite';
import houdini from '@ewen-lbh/houdini/vite';
import { kitRoutes } from 'vite-plugin-kit-routes';
import { type KIT_ROUTES } from './src/lib/ROUTES';
import { defineConfig } from 'vite';
import icons from 'unplugin-icons/vite';

export default defineConfig({
	plugins: [
		icons({
			compiler: 'svelte',
			defaultClass: 'icon',
			scale: 1.25,
		}),
		houdini({
			autoCodeGen: 'smart'
		}),
		sveltekit(),
		kitRoutes<KIT_ROUTES>({
			format_short: true,
			format: 'route(path)',
			PAGES: {
				'/search': {
					explicit_search_params: {
						q: {
							type: 'string',
							required: true,
							default: '""'
						}
					}
				}
			}
		})
	],
	resolve: {
		alias: {
			'~icons/msl': '~icons/material-symbols-light'
		}
	}
});
