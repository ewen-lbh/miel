/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
	schemaPath: './schema.gql',
	plugins: {
		'houdini-svelte': {
			client: './src/lib/client'
		}
	},
	scalars: {
		EmailAddress: {
			type: 'string'
		},
		HTML: {
			type: 'App.XSSSafeHTMLString'
		},
		URL: {
			type: 'URL',
			marshal: (x) => x.toString(),
			unmarshal: (x) => new URL(x)
		},
		Color: {
			type: 'string'
		}
	}
};

export default config;
