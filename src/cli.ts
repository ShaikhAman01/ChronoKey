import { randomBytes } from 'node:crypto';
import { base32Encode, base32Decode } from './base32.ts';
import { generateTOTP } from './totp.ts';
import { generateHOTP } from './hotp.ts';

const STEP = 30;

function otpauthUri(label: string, secretBase32: string, issuer = 'ChronoKey'): string {
    const params = new URLSearchParams({
        secret: secretBase32,
        issuer,
        algorithm: 'SHA1',
        digits: '6',
        period: String(STEP),
    });
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?${params.toString()}`;
}

function fail(message: string): never {
    console.error(message);
    process.exit(1);
}

const [, , command, ...args] = process.argv;

switch (command) {
    case 'enroll': {
        const label = args[0] ?? 'user@example.com';
        const secretBase32 = base32Encode(randomBytes(20));
        console.log('Secret (base32):', secretBase32);
        console.log('otpauth URI:', otpauthUri(label, secretBase32));
        console.log('\nSave the secret above somewhere safe, then run:');
        console.log(`  npm run cli -- code ${secretBase32}`);
        break;
    }

    case 'code': {
        const secretBase32 = args[0];
        if (!secretBase32) fail('Usage: cli code <base32-secret>');

        const secretBuffer = base32Decode(secretBase32);
        const code = generateTOTP(secretBuffer, 6, STEP);
        const remaining = STEP - (Math.floor(Date.now() / 1000) % STEP);
        console.log(`Code: ${code} (valid for ${remaining}s)`);
        break;
    }

    case 'hotp': {
        const secretBase32 = args[0];
        const counterArg = args[1];
        if (!secretBase32 || counterArg === undefined) fail('Usage: cli hotp <base32-secret> <counter>');

        const secretBuffer = base32Decode(secretBase32);
        console.log('Code:', generateHOTP(secretBuffer, Number(counterArg), 6));
        break;
    }

    default:
        console.log('Usage: cli <enroll [label]|code <secret>|hotp <secret> <counter>>');
        process.exit(command ? 1 : 0);
}
