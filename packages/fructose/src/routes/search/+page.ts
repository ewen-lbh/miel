export const _PageSearchVariables = ({ url: { searchParams } }) => ({
	q: searchParams.get('q') ?? ''
});
