#!/usr/bin/env node

/**
 * Migration script to copy files from MinIO to Cloudflare R2
 * 
 * Usage:
 *   # Set environment variables
 *   export MINIO_ENDPOINT="http://localhost:9000"
 *   export MINIO_ACCESS_KEY="supermark"
 *   export MINIO_SECRET_KEY="your-minio-password"
 *   export MINIO_BUCKET="supermark-documents"
 *   
 *   export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
 *   export R2_ACCESS_KEY="your-r2-access-key-id"
 *   export R2_SECRET_KEY="your-r2-secret-access-key"
 *   export R2_BUCKET="supermark-documents"
 *   
 *   # Run migration
 *   node scripts/migrate-minio-to-r2.js
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

// Configuration from environment variables
const config = {
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'supermark',
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET || 'supermark-documents',
  },
  r2: {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
    bucket: process.env.R2_BUCKET || 'supermark-documents',
  },
};

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (!config.minio.secretAccessKey) {
    errors.push('Missing MINIO_SECRET_KEY environment variable');
  }
  if (!config.r2.endpoint) {
    errors.push('Missing R2_ENDPOINT environment variable');
  }
  if (!config.r2.accessKeyId) {
    errors.push('Missing R2_ACCESS_KEY environment variable');
  }
  if (!config.r2.secretAccessKey) {
    errors.push('Missing R2_SECRET_KEY environment variable');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

// Create S3 clients
const minioClient = new S3Client({
  endpoint: config.minio.endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.minio.accessKeyId,
    secretAccessKey: config.minio.secretAccessKey,
  },
  forcePathStyle: true,
});

const r2Client = new S3Client({
  endpoint: config.r2.endpoint,
  region: 'auto',
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

// Convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Copy a single file from MinIO to R2
async function copyFile(key, metadata) {
  try {
    console.log(`  Downloading: ${key}`);
    
    // Get object from MinIO
    const getCommand = new GetObjectCommand({
      Bucket: config.minio.bucket,
      Key: key,
    });
    const getResponse = await minioClient.send(getCommand);
    
    // Convert stream to buffer
    const bodyBuffer = await streamToBuffer(getResponse.Body);
    
    console.log(`  Uploading to R2: ${key} (${bodyBuffer.length} bytes)`);
    
    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: getResponse.ContentType,
      ContentLength: bodyBuffer.length,
      Metadata: getResponse.Metadata || {},
    });
    
    await r2Client.send(putCommand);
    console.log(`  ✓ Successfully copied: ${key}`);
    
    return { success: true, key, size: bodyBuffer.length };
  } catch (error) {
    console.error(`  ✗ Error copying ${key}:`, error.message);
    return { success: false, key, error: error.message };
  }
}

// List all objects in MinIO bucket
async function listAllObjects() {
  const objects = [];
  let continuationToken = undefined;
  
  console.log(`Listing objects in MinIO bucket: ${config.minio.bucket}`);
  
  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: config.minio.bucket,
      ContinuationToken: continuationToken,
    });
    
    const response = await minioClient.send(listCommand);
    
    if (response.Contents) {
      objects.push(...response.Contents);
    }
    
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  
  return objects;
}

// Main migration function
async function migrate() {
  console.log('='.repeat(60));
  console.log('MinIO to Cloudflare R2 Migration');
  console.log('='.repeat(60));
  console.log();
  
  console.log('Configuration:');
  console.log(`  Source (MinIO):      ${config.minio.endpoint}/${config.minio.bucket}`);
  console.log(`  Destination (R2):    ${config.r2.endpoint}/${config.r2.bucket}`);
  console.log();
  
  try {
    // List all objects
    const objects = await listAllObjects();
    console.log(`Found ${objects.length} objects to migrate`);
    console.log();
    
    if (objects.length === 0) {
      console.log('No objects to migrate. Exiting.');
      return;
    }
    
    // Confirm migration
    console.log('Starting migration in 3 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log();
    
    // Migrate each object
    const results = {
      total: objects.length,
      success: 0,
      failed: 0,
      totalBytes: 0,
    };
    
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      console.log(`[${i + 1}/${objects.length}] Processing: ${obj.Key}`);
      
      const result = await copyFile(obj.Key, obj);
      
      if (result.success) {
        results.success++;
        results.totalBytes += result.size;
      } else {
        results.failed++;
      }
      
      console.log();
    }
    
    // Print summary
    console.log('='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total objects:     ${results.total}`);
    console.log(`Successfully copied: ${results.success}`);
    console.log(`Failed:            ${results.failed}`);
    console.log(`Total data:        ${(results.totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log();
    
    if (results.failed > 0) {
      console.log('⚠️  Migration completed with errors. Review the log above for details.');
      process.exit(1);
    } else {
      console.log('✓ Migration completed successfully!');
      console.log();
      console.log('Next steps:');
      console.log('1. Verify files are accessible in R2 dashboard');
      console.log('2. Test download functionality in your application');
      console.log('3. Update production environment variables to use R2');
      console.log('4. Remove MinIO service from docker-compose.yml (if desired)');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
validateConfig();
migrate().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
