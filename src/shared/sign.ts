import { textEncoder } from "../const";
import { SignInfoDefaults, defaultSignInfoDefaults, encodeArrayBufferToBase64, genAlgorithmForSignAndVerify, getWebcrypto } from "../utils";

export async function genSignature(privateKey: CryptoKey, signingString: string, defaults: SignInfoDefaults = defaultSignInfoDefaults) {
	if (defaults.rsa && (privateKey.algorithm.name === 'RSA-PSS' || privateKey.algorithm.name === 'RSASSA-PKCS1-v1_5') && defaults.rsa !== privateKey.algorithm.name) throw new Error('CryptoKey RSA mode conflicts with signing defaults');
	const signatureAB = await (await getWebcrypto()).subtle.sign(genAlgorithmForSignAndVerify(privateKey.algorithm, defaults.hash), privateKey, textEncoder.encode(signingString));
	return encodeArrayBufferToBase64(signatureAB);
}
