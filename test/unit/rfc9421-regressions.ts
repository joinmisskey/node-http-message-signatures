import * as api from '../../src/index.js';
import { createVerificationCases, verificationCaseNames } from '../verification-cases.js';

let cases: Awaited<ReturnType<typeof createVerificationCases>>;
beforeAll(async () => {
	cases = await createVerificationCases(api, await api.getWebcrypto());
});

describe('RFC 9421 native crypto regressions', () => {
	test.each(verificationCaseNames)('%s', async name => {
		await cases[name]();
	});
});
