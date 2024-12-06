/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
	schemaPath: './schema.gql',
	plugins: {
		'houdini-svelte': {
			client: './src/lib/client'
		}
	},
	types: {
		QueryScreeningsConnectionEdge: {
			keys: ['cursor']
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
		},
		DateTime: {
			type: 'Date',
			marshal: (x) => x.toISOString(),
			unmarshal: (x) => new Date(x)
		}
	}
};

export default config;
