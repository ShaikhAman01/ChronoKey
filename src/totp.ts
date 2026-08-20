import { generateHOTP } from './hotp.ts';

export function generateTOTP(secret: string | Buffer, digits: number = 6, step: number = 30): string {
    const T0 = 0;
    const currentUnixTimeSeconds = Math.floor(Date.now() / 1000);
    const counter = Math.floor((currentUnixTimeSeconds - T0) / step);
    return generateHOTP(secret, counter, digits);
}