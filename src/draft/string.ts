import { collectHeaders } from "../utils.js";
import { IncomingRequest } from "../types.js";

export function genDraftSigningString(
	source: IncomingRequest,
	includeHeaders: string[],
	additional?: {
		keyId: string;
		algorithm: string;
		created?: string;
		expires?: string;
		opaque?: string;
	}
) {
	if (!source.method) {
		throw new Error('Request method not found');
	}
	if (!source.url) {
		throw new Error('Request URL not found');
	}

	const headers = collectHeaders(source);

	const results: string[] = [];

	for (const key of includeHeaders.map(x => x.toLowerCase())) {
		if (key === '(request-target)') {
			let requestTarget: string;
			if (source.url.startsWith('/')) {
				requestTarget = source.url.split('#', 1)[0];
			} else {
				const url = new URL(source.url);
				// URL.search omits an explicitly empty query; retain its delimiter.
				const search = url.search || (url.href.split('#', 1)[0].endsWith('?') ? '?' : '');
				requestTarget = url.pathname + search;
			}
			results.push(`(request-target): ${source.method.toLowerCase()} ${requestTarget}`);
		} else if (key === '(keyid)') {
			results.push(`(keyid): ${additional?.keyId}`);
		} else if (key === '(algorithm)') {
			results.push(`(algorithm): ${additional?.algorithm}`);
		}	else if (key === '(created)') {
			results.push(`(created): ${additional?.created}`);
		} else if (key === '(expires)') {
			results.push(`(expires): ${additional?.expires}`);
		} else if (key === '(opaque)') {
			results.push(`(opaque): ${additional?.opaque}`);
		} else {
			if (key === 'date' && !headers['date'] && headers['x-date']) {
				results.push(`date: ${headers['x-date']}`);
			} else {
				results.push(`${key}: ${headers[key]}`);
			}
		}
	}

	return results.join('\n');
}
