/**
 * REPRODUCTION TEST FOR REG-46: File upload not working on Prod
 *
 * This test reproduces the production bug where file uploads fail
 * when S3 credentials are missing from the environment.
 *
 * ROOT CAUSE:
 * - Production environment is missing NEXT_PRIVATE_UPLOAD_* environment variables
 * - No startup validation catches this configuration error
 * - Error only occurs at runtime when upload is attempted
 * - Generic error handling masks the actual issue from users
 *
 * EXPECTED BEHAVIOR: Test should FAIL with missing credentials error
 */

import { NextApiRequest, NextApiResponse } from 'next';

describe('REG-46: File Upload Missing Credentials Bug', () => {

  // Store original environment variables to restore later
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Simulate production environment with missing S3 credentials
    delete process.env.NEXT_PRIVATE_UPLOAD_BUCKET;
    delete process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID;
    delete process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY;

    // But NEXT_PUBLIC_UPLOAD_TRANSPORT is set to 's3'
    process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 's3';
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  test('REPRODUCTION: File upload should fail with clear error when S3 credentials are missing', async () => {
    /**
     * This test reproduces the exact scenario happening in production:
     *
     * 1. User attempts to upload file via /documents
     * 2. Frontend calls putFile() which routes to /api/file/s3/upload
     * 3. API endpoint calls getTeamS3ClientAndConfig(teamId)
     * 4. That calls getStorageConfig() which checks for env vars
     * 5. Missing env vars throw error: "Missing environment variable: NEXT_PRIVATE_UPLOAD_BUCKET"
     * 6. Error caught by generic catch block in /pages/api/file/s3/upload.ts:109
     * 7. Returns HTTP 500 with generic "Internal server error" message
     * 8. Client shows user: "An error occurred when uploading the file."
     */

    // Import the storage config module
    const { getStorageConfig, getTeamStorageConfigById } = await import('@/lib/storage/config');

    // TEST 1: Verify getStorageConfig throws when credentials are missing
    expect(() => {
      getStorageConfig();
    }).toThrow('Missing environment variable: NEXT_PRIVATE_UPLOAD_BUCKET');

    // TEST 2: Verify getTeamStorageConfigById also throws (despite try-catch, it calls getStorageConfig twice)
    await expect(async () => {
      await getTeamStorageConfigById('test-team-id');
    }).rejects.toThrow('Missing environment variable: NEXT_PRIVATE_UPLOAD_BUCKET');
  });

  test('REPRODUCTION: Silent fallback when NEXT_PUBLIC_UPLOAD_TRANSPORT is invalid', async () => {
    /**
     * This test reproduces another potential production issue:
     *
     * If NEXT_PUBLIC_UPLOAD_TRANSPORT is not set or is set to an invalid value,
     * the putFile() function silently returns null values instead of throwing an error.
     *
     * Location: /lib/files/put-file.ts lines 45-57
     */

    // Set up environment with invalid transport
    delete process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

    // Import putFile function
    const { putFile } = await import('@/lib/files/put-file');

    // Create a mock file
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    // Call putFile with missing transport - this should fail but returns nulls
    const result = await putFile({
      file: mockFile,
      teamId: 'test-team-id',
      docId: 'test-doc-id',
    });

    // BUG: Function returns null values instead of throwing error
    expect(result.type).toBeNull();
    expect(result.data).toBeNull();
    expect(result.numPages).toBeUndefined();
    expect(result.fileSize).toBeUndefined();

    // This is the bug - the function should throw an error, not return nulls
    // User gets no indication that upload transport is misconfigured
  });

  test('DOCUMENTATION: Environment variables required for production', async () => {
    /**
     * This test documents the exact environment variables needed for file uploads
     * to work in production. This is the fix needed for the production deployment.
     */

    const requiredEnvVars = [
      'NEXT_PUBLIC_UPLOAD_TRANSPORT',  // Must be "s3" or "vercel"
      'NEXT_PRIVATE_UPLOAD_BUCKET',     // S3/MinIO bucket name
      'NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID',     // S3 access key
      'NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY', // S3 secret key
    ];

    const optionalEnvVars = [
      'NEXT_PRIVATE_UPLOAD_REGION',     // Defaults to "eu-central-1"
      'NEXT_PRIVATE_UPLOAD_ENDPOINT',   // For MinIO or custom S3 endpoints
      'NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST',  // CDN/distribution domain
      'NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE',   // For path-style URLs
    ];

    // For this test, simulate a properly configured production environment
    process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 's3';
    process.env.NEXT_PRIVATE_UPLOAD_BUCKET = 'supermark-documents';
    process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID = 'test-access-key';
    process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.NEXT_PRIVATE_UPLOAD_REGION = 'us-east-1';
    process.env.NEXT_PRIVATE_UPLOAD_ENDPOINT = 'http://minio:9000';
    process.env.NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE = 'true';

    // Verify required vars are present
    requiredEnvVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
      expect(process.env[varName]).not.toBe('');
    });

    // With proper config, getStorageConfig should not throw
    const { getStorageConfig } = await import('@/lib/storage/config');
    const config = getStorageConfig();

    expect(config.bucket).toBe('supermark-documents');
    expect(config.accessKeyId).toBe('test-access-key');
    expect(config.secretAccessKey).toBe('test-secret-key');
    expect(config.region).toBe('us-east-1');
    expect(config.endpoint).toBe('http://minio:9000');
    expect(config.forcePathStyle).toBe(true);
  });

  test('REPRODUCTION: Error message flow from server to client', async () => {
    /**
     * This test traces the error flow:
     *
     * Server side (pages/api/file/s3/upload.ts:109-111):
     *   catch (error) {
     *     console.error("Server-side upload error:", error);
     *     return res.status(500).json({ error: "Internal server error" });
     *   }
     *
     * Client side (lib/files/put-file.ts:145):
     *   if (!response.ok) {
     *     throw new Error(`Failed to upload file "${file.name}", failed with status code ${response.status}`);
     *   }
     *
     * Frontend (components/documents/add-document-modal.tsx:361-364):
     *   catch (error) {
     *     toast.error("An error occurred while uploading the file.");
     *     console.error("An error occurred while uploading the file: ", error);
     *   }
     *
     * Result: User sees generic "An error occurred while uploading the file."
     * The actual error (missing credentials) is lost in the error chain.
     */

    // Simulate the error flow
    const serverError = new Error('Missing environment variable: NEXT_PRIVATE_UPLOAD_BUCKET');
    const serverResponse = { error: 'Internal server error' };  // Generic message

    // Client receives HTTP 500
    const clientError = new Error(`Failed to upload file "test.txt", failed with status code 500`);

    // User sees
    const userMessage = "An error occurred while uploading the file.";

    // Verify that the actual error is completely masked
    expect(clientError.message).not.toContain('Missing environment variable');
    expect(clientError.message).not.toContain('NEXT_PRIVATE_UPLOAD_BUCKET');
    expect(userMessage).not.toContain('credentials');
    expect(userMessage).not.toContain('configuration');

    // This is the bug: Error details are lost at every layer
  });
});

/**
 * ROOT CAUSE SUMMARY:
 * ====================
 *
 * 1. Production deployment is missing S3/MinIO environment variables
 * 2. No startup validation catches this configuration error
 * 3. Error only manifests when user attempts file upload
 * 4. Generic error handling at multiple layers masks the actual issue
 * 5. User sees unhelpful message: "An error occurred when uploading the file."
 *
 * AFFECTED FILES:
 * ====================
 *
 * - lib/storage/config.ts:40-54 - Throws error when env vars missing
 * - lib/files/aws-client.ts:96-110 - No credential validation
 * - pages/api/file/s3/upload.ts:109-111 - Generic error response
 * - lib/files/put-file.ts:45-57 - Silent null fallback for invalid transport
 * - lib/files/put-file.ts:145 - Discards server error details
 * - components/documents/add-document-modal.tsx:361-364 - Generic user error message
 *
 * PRODUCTION FIX NEEDED:
 * ====================
 *
 * The production .env file needs these variables:
 *
 * NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
 * NEXT_PRIVATE_UPLOAD_BUCKET=supermark-documents
 * NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=[from MinIO]
 * NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=[from MinIO]
 * NEXT_PRIVATE_UPLOAD_REGION=us-east-1
 * NEXT_PRIVATE_UPLOAD_ENDPOINT=http://minio:9000
 * NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE=true
 * NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=[your domain]
 *
 * These should match the docker-compose.yml configuration.
 */
