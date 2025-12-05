#!/usr/bin/env node

/**
 * R2 Connection Test Script
 * Tests upload, download, and presigned URL generation
 */

const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const config = {
  endpoint: process.env.NEXT_PRIVATE_UPLOAD_ENDPOINT,
  region: process.env.NEXT_PRIVATE_UPLOAD_REGION || 'auto',
  bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
  accessKeyId: process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
  distributionHost: process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST,
};

console.log('='.repeat(60));
console.log('R2 Configuration Test');
console.log('='.repeat(60));
console.log();

// Validate configuration
console.log('Configuration:');
console.log(`  Endpoint: ${config.endpoint || '(not set)'}`);
console.log(`  Region: ${config.region}`);
console.log(`  Bucket: ${config.bucket || '(not set)'}`);
console.log(`  Access Key: ${config.accessKeyId ? config.accessKeyId.substring(0, 10) + '...' : '(not set)'}`);
console.log(`  Secret Key: ${config.secretAccessKey ? '***' + config.secretAccessKey.substring(config.secretAccessKey.length - 4) : '(not set)'}`);
console.log(`  Distribution Host: ${config.distributionHost || '(not set)'}`);
console.log();

const errors = [];
if (!config.endpoint) errors.push('NEXT_PRIVATE_UPLOAD_ENDPOINT not set');
if (!config.bucket) errors.push('NEXT_PRIVATE_UPLOAD_BUCKET not set');
if (!config.accessKeyId) errors.push('NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID not set');
if (!config.secretAccessKey) errors.push('NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY not set');
if (!config.distributionHost) errors.push('NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST not set');

if (errors.length > 0) {
  console.error('❌ Configuration errors:');
  errors.forEach(err => console.error(`   - ${err}`));
  process.exit(1);
}

// Create S3 client
const client = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
});

async function runTests() {
  console.log('Running tests...');
  console.log();

  // Test 1: List objects (test connection)
  try {
    console.log('Test 1: List objects in bucket');
    const listCommand = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 5,
    });
    const listResult = await client.send(listCommand);
    console.log(`  ✓ Connection successful`);
    console.log(`  ✓ Found ${listResult.KeyCount || 0} objects`);
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log(`  ✓ Sample files:`);
      listResult.Contents.slice(0, 3).forEach(obj => {
        console.log(`     - ${obj.Key} (${obj.Size} bytes)`);
      });
    }
  } catch (error) {
    console.error(`  ✗ Failed: ${error.message}`);
    return;
  }
  console.log();

  // Test 2: Upload test file
  const testKey = `test-${Date.now()}.txt`;
  const testContent = 'This is a test file uploaded at ' + new Date().toISOString();
  
  try {
    console.log('Test 2: Upload test file');
    const putCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });
    await client.send(putCommand);
    console.log(`  ✓ Upload successful: ${testKey}`);
  } catch (error) {
    console.error(`  ✗ Upload failed: ${error.message}`);
    return;
  }
  console.log();

  // Test 3: Generate presigned GET URL
  try {
    console.log('Test 3: Generate presigned GET URL');
    const getCommand = new GetObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
    });
    const presignedUrl = await getSignedUrl(client, getCommand, { expiresIn: 3600 });
    console.log(`  ✓ Presigned URL generated`);
    console.log(`  URL: ${presignedUrl.substring(0, 80)}...`);
  } catch (error) {
    console.error(`  ✗ Failed to generate presigned URL: ${error.message}`);
  }
  console.log();

  // Test 4: Distribution URL construction
  try {
    console.log('Test 4: Distribution URL construction');
    const distributionUrl = `https://${config.distributionHost}/${testKey}`;
    console.log(`  ✓ Distribution URL: ${distributionUrl}`);
    console.log(`  Note: Visit this URL in browser to test public access`);
  } catch (error) {
    console.error(`  ✗ Failed: ${error.message}`);
  }
  console.log();

  console.log('='.repeat(60));
  console.log('✓ All tests completed');
  console.log('='.repeat(60));
  console.log();
  console.log('Next steps:');
  console.log('1. Visit the distribution URL in your browser');
  console.log('2. Verify the test file downloads');
  console.log('3. If it works, R2 is configured correctly!');
  console.log();
}

runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
