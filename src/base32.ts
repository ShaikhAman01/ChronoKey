// RFC 4648 base32 (the encoding used by otpauth:// secrets / QR codes)
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(data: Uint8Array): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of data) {
        value = ((value << 8) | byte) & 0xffff;
        bits += 8;
        while (bits >= 5) {
            output += ALPHABET[(value >>> (bits - 5)) & 0x1f];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += ALPHABET[(value << (5 - bits)) & 0x1f];
    }

    while (output.length % 8 !== 0) {
        output += '=';
    }

    return output;
}

// Authenticator apps show secrets in lowercase groups ("jbsw y3dp ..."), so spaces and dashes are ignored.
export function base32Decode(input: string): Uint8Array {
    const clean = input.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (const char of clean) {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) {
            throw new Error(`Invalid base32 character: ${char}`);
        }
        value = ((value << 5) | idx) & 0xffff;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }

    return Uint8Array.from(bytes);
}
