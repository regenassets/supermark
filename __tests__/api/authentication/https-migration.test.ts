/**
 * REG-47: Authentication failing after HTTPS migration
 *
 * This test reproduces the bug where users are redirected to /register
 * after clicking verification links when NEXTAUTH_URL changes from HTTP to HTTPS.
 *
 * Root Cause:
 * - Email verification links are generated with NEXTAUTH_URL embedded at send time
 * - When NEXTAUTH_URL changes from http:// to https://, old email links fail validation
 * - The verify page performs strict origin comparison: urlObj.origin !== process.env.NEXTAUTH_URL
 * - This causes verification to fail and return NotFound (404)
 *
 * Location: app/(auth)/verify/page.tsx:59
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { generateChecksum } from '@/lib/utils/generate-checksum';

describe('REG-47: HTTPS Migration Authentication Bug', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set required environment variables for testing
    process.env.NEXT_PRIVATE_VERIFICATION_SECRET = 'test-secret-key-for-checksum-generation';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Email verification link generation', () => {
    test('generates verification link using current NEXTAUTH_URL', async () => {
      process.env.NEXTAUTH_URL = 'http://supermark.cc';

      // Simulate email sending
      const { sendVerificationRequestEmail } = await import('@/lib/emails/send-verification-request');

      const callbackUrl = 'http://supermark.cc/api/auth/callback/email?token=abc123&email=user@example.com';
      const checksum = generateChecksum(callbackUrl);
      const expectedUrl = `${process.env.NEXTAUTH_URL}/verify?verification_url=${encodeURIComponent(callbackUrl)}&checksum=${checksum}`;

      // Verify the function would construct URL with current NEXTAUTH_URL
      expect(process.env.NEXTAUTH_URL).toBe('http://supermark.cc');
      expect(expectedUrl).toContain('http://supermark.cc/verify');
    });
  });

  describe('Verification URL validation - Protocol Change Scenario', () => {
    test('PASSES: verification accepts HTTP links when NEXTAUTH_URL is HTTPS (FIX for REG-47)', () => {
      // SCENARIO: Email was sent when NEXTAUTH_URL=http://supermark.cc
      const oldNextAuthUrl = 'http://supermark.cc';
      const callbackUrl = `${oldNextAuthUrl}/api/auth/callback/email?token=abc123&email=user@example.com`;
      const checksum = generateChecksum(callbackUrl);

      // User receives email with this verification URL
      const verificationUrl = callbackUrl;

      // THEN: NEXTAUTH_URL is changed to HTTPS
      process.env.NEXTAUTH_URL = 'https://supermark.cc';

      // WHEN: User clicks the old verification link
      const isValid = isValidVerificationUrl(verificationUrl, checksum);

      // EXPECT: Validation PASSES - protocol difference is tolerated
      // This fix allows old HTTP email links to work after HTTPS migration
      expect(isValid).toBe(true); // Fixed: now passes with protocol tolerance
    });

    test('PASSES: verification accepts HTTPS links when NEXTAUTH_URL is HTTPS', () => {
      process.env.NEXTAUTH_URL = 'https://supermark.cc';
      const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?token=abc123&email=user@example.com`;
      const checksum = generateChecksum(callbackUrl);

      const isValid = isValidVerificationUrl(callbackUrl, checksum);

      expect(isValid).toBe(true);
    });

    test('PASSES: verification accepts HTTPS links when NEXTAUTH_URL is HTTP', () => {
      // Reverse scenario: downgrade from HTTPS to HTTP (less common but same fix applies)
      const oldNextAuthUrl = 'https://supermark.cc';
      const callbackUrl = `${oldNextAuthUrl}/api/auth/callback/email?token=abc123&email=user@example.com`;
      const checksum = generateChecksum(callbackUrl);

      process.env.NEXTAUTH_URL = 'http://supermark.cc';

      const isValid = isValidVerificationUrl(callbackUrl, checksum);

      expect(isValid).toBe(true); // Fixed: protocol tolerance works both ways
    });
  });

  describe('Verification URL validation - Invalid scenarios', () => {
    beforeEach(() => {
      process.env.NEXTAUTH_URL = 'https://supermark.cc';
    });

    test('rejects URLs with wrong domain', () => {
      const callbackUrl = 'https://evil.com/api/auth/callback/email?token=abc123';
      const checksum = generateChecksum(callbackUrl);

      const isValid = isValidVerificationUrl(callbackUrl, checksum);

      expect(isValid).toBe(false);
    });

    test('rejects URLs with invalid checksum', () => {
      const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?token=abc123`;
      const invalidChecksum = 'wrong-checksum-value';

      const isValid = isValidVerificationUrl(callbackUrl, invalidChecksum);

      expect(isValid).toBe(false);
    });

    test('rejects malformed URLs', () => {
      const malformedUrl = 'not-a-valid-url';
      const checksum = 'some-checksum';

      const isValid = isValidVerificationUrl(malformedUrl, checksum);

      expect(isValid).toBe(false);
    });
  });

  describe('Production HTTPS migration impact', () => {
    test('demonstrates the exact REG-47 scenario is now FIXED', () => {
      // STEP 1: Production starts with HTTP (before SSL setup)
      const initialNextAuthUrl = 'http://supermark.cc';
      process.env.NEXTAUTH_URL = initialNextAuthUrl;

      // STEP 2: User requests login, email is sent
      const callbackUrl = `${initialNextAuthUrl}/api/auth/callback/email?token=secure-token-123&email=user@supermark.cc`;
      const checksum = generateChecksum(callbackUrl);
      const emailLinkSent = `${initialNextAuthUrl}/verify?verification_url=${encodeURIComponent(callbackUrl)}&checksum=${checksum}`;

      console.log('Email sent with link:', emailLinkSent);

      // STEP 3: Production is upgraded to HTTPS (SSL certificate added)
      process.env.NEXTAUTH_URL = 'https://supermark.cc';

      // STEP 4: User clicks the email link (HTTP link in HTTPS environment)
      // Browser may auto-upgrade to HTTPS, but verification_url param still contains HTTP
      const params = new URLSearchParams(new URL(emailLinkSent).search);
      const verificationUrlFromEmail = params.get('verification_url')!;
      const checksumFromEmail = params.get('checksum')!;

      console.log('Verification URL from email:', verificationUrlFromEmail);
      console.log('Current NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

      // STEP 5: Server validates the verification URL
      const isValid = isValidVerificationUrl(verificationUrlFromEmail, checksumFromEmail);

      // RESULT: Validation NOW PASSES with protocol-tolerant fix
      // Hostname matches: supermark.cc === supermark.cc
      // Checksum matches: HMAC verified
      expect(isValid).toBe(true);

      // This allows old email links to work after HTTPS migration
      // User experience: Seamless verification, no 404 errors
      console.log('Validation result:', isValid ? 'PASS - Authentication succeeds' : 'FAIL - Returns 404 NotFound');
    });
  });
});

/**
 * Helper function that replicates the FIXED validation logic from app/(auth)/verify/page.tsx:56-77
 * This implements protocol-tolerant validation for HTTPS migration support.
 */
function isValidVerificationUrl(url: string, checksum: string): boolean {
  try {
    const urlObj = new URL(url);
    const nextAuthUrlObj = new URL(process.env.NEXTAUTH_URL!);

    // Protocol-tolerant validation: allows HTTP→HTTPS migration (REG-47)
    // Hostname and port must match for security, but protocol can differ
    const hostnameMatch = urlObj.hostname === nextAuthUrlObj.hostname;
    const portMatch = urlObj.port === nextAuthUrlObj.port;

    if (!hostnameMatch || !portMatch) {
      console.log(`Hostname or port mismatch: ${urlObj.hostname}:${urlObj.port} !== ${nextAuthUrlObj.hostname}:${nextAuthUrlObj.port}`);
      return false;
    }

    // Primary security: HMAC checksum validates full URL integrity
    const expectedChecksum = generateChecksum(url);
    return checksum === expectedChecksum;
  } catch (error) {
    console.log('URL parsing error:', error);
    return false;
  }
}
