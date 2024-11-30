import { sveltekit } from '@sveltejs/kit/vite'
import houdini from 'houdini/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
	  icons({
      compiler: 'svelte',
      defaultClass: 'icon',
      scale: 1.5,
      customCollections: {
        'custom-logos': FileSystemIconLoader('./src/lib/logos'),
      },
    }),	

		houdini(), sveltekit()]
});
