export type TravelPathSegment = {
	raw: string;
	from?: string;
	by?: string;
	with?: string;
	id?: string;
	envelopeFrom?: string;
	for?: string;
	at?: Date | null;
	fromIp?: string;
	using?: string;
	cipher?: string;
};

export function parseReceivedHeader(segment: string) {
	const { groups } =
		/(from (?<from>.+?) \(.*?\[(?<ip>.+)\]\) )?( \(using (?<using>.+?)( with cipher (?<cipher>.+?))?\))?by (?<by>.+?)( with (?<with>.+?))?( id (?<id>.+?))?(( \(envelope-from <(?<envelopeFrom>.+?)>\) )?for <(?<for>.+?)>)?; (?<date>.+)$/.exec(
			segment
		) ?? {};

	if (!groups) return { raw: segment };

	return {
		raw: segment,
		at: groups.date ? new Date(groups.date) : undefined,
		fromIp: groups.ip,
		...groups
	} as TravelPathSegment;
}
