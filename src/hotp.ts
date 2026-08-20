import { createHmac } from 'crypto';

const NodeBuffer = (globalThis as any).Buffer;

export function generateHOTP(secret: string | Buffer, counter: number, digits: number = 6): string {
    if (!NodeBuffer) {
        throw new Error('Buffer is not available in this runtime.');
    }

    // Converting counter to a buffer
    const counterBuffer = NodeBuffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const keyBuffer = NodeBuffer.isBuffer(secret) ? secret : NodeBuffer.from(secret, 'ascii');

    // Creating a HMAC using secret and counter
    const hmac = createHmac('sha1', keyBuffer);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();

    // Extracting dynamic binary code
    const lastByte = hmacResult[hmacResult.length - 1];
    if (lastByte === undefined) throw new Error('Last byte of HMAC result is undefined');
    const offset = lastByte & 0x0f;
    
    const b0 = hmacResult[offset];
    if (b0 === undefined) throw new Error('Byte at offset is undefined');
    const b1 = hmacResult[offset + 1];
    if (b1 === undefined) throw new Error('Byte at offset + 1 is undefined');
    const b2 = hmacResult[offset + 2];
    if (b2 === undefined) throw new Error('Byte at offset + 2 is undefined');
    const b3 = hmacResult[offset + 3];
    if (b3 === undefined) throw new Error('Byte at offset + 3 is undefined');
    
    const dbc = ((b0 & 0x7f) << 24) |
                ((b1 & 0xff) << 16) |
                ((b2 & 0xff) << 8) |
                (b3 & 0xff);

    // Generating th HOTP token
    const hotp = dbc % (10 ** digits);
    return hotp.toString().padStart(digits, '0');
}