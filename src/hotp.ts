export type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface HotpOptions {
    digits?: number;
    algorithm?: Algorithm;
}

export interface HotpSteps {
    counter: bigint;
    counterBytes: Uint8Array;
    hmac: Uint8Array;
    offset: number;
    slice: Uint8Array;
    binary: number;
    modulus: number;
    code: string;
}

const encoder = new TextEncoder();

export function toKey(secret: string | Uint8Array): Uint8Array {
    return typeof secret === 'string' ? encoder.encode(secret) : secret;
}

function checkDigits(digits: number): void {
    if (!Number.isInteger(digits) || digits < 6 || digits > 10) {
        throw new RangeError('digits must be an integer between 6 and 10');
    }
}

export async function hmac(algorithm: Algorithm, key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    if (key.length === 0) {
        throw new Error('Secret must not be empty');
    }
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as Uint8Array<ArrayBuffer>,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign'],
    );
    return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, message as Uint8Array<ArrayBuffer>));
}

export async function hotpSteps(
    secret: string | Uint8Array,
    counter: number | bigint,
    { digits = 6, algorithm = 'SHA-1' }: HotpOptions = {},
): Promise<HotpSteps> {
    checkDigits(digits);
    const big = BigInt(counter);
    if (big < 0n || big > 0xffff_ffff_ffff_ffffn) {
        throw new RangeError('counter must fit in an unsigned 64-bit integer');
    }

    const counterBytes = new Uint8Array(8);
    new DataView(counterBytes.buffer).setBigUint64(0, big);

    const mac = await hmac(algorithm, toKey(secret), counterBytes);

    // Dynamic truncation: the low nibble of the last byte picks where to read 4 bytes from
    const offset = mac[mac.length - 1]! & 0x0f;
    const slice = mac.slice(offset, offset + 4);
    const binary = new DataView(slice.buffer).getUint32(0) & 0x7fff_ffff;
    const modulus = 10 ** digits;
    const code = (binary % modulus).toString().padStart(digits, '0');

    return { counter: big, counterBytes, hmac: mac, offset, slice, binary, modulus, code };
}

export async function generateHOTP(
    secret: string | Uint8Array,
    counter: number | bigint,
    options: HotpOptions = {},
): Promise<string> {
    return (await hotpSteps(secret, counter, options)).code;
}
