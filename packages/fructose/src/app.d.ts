// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		type XSSSafeHTMLString = import('ts-opaque').Opaque<string, 'XSSSafeHTMLString'>;
		interface Error {
			message: string;
		}
		interface Session {
			token: string | null;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Metadata {
			queryTimestamps: {
				global: number;
				network: number;
			};
		}
	}
}

export {};
