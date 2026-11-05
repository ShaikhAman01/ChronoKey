import type { Algorithm } from './hotp.ts';

export interface OtpauthOptions {
    label: string;
    secretBase32: string;
    issuer?: string;
    algorithm?: Algorithm;
    digits?: number;
    step?: number;
}

export function otpauthUri({
    label,
    secretBase32,
    issuer = 'ChronoKey',
    algorithm = 'SHA-1',
    digits = 6,
    step = 30,
}: OtpauthOptions): string {
    const params = new URLSearchParams({
        secret: secretBase32.replace(/[\s=-]/g, '').toUpperCase(),
        issuer,
        algorithm: algorithm.replace('-', ''),
        digits: String(digits),
        period: String(step),
    });
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?${params.toString()}`;
}
