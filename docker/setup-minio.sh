#!/bin/bash
set -e

echo "Setting up MinIO for Supermark..."

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
until curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; do
  echo "Waiting for MinIO..."
  sleep 2
done

echo "MinIO is ready!"

# Configure MinIO client
mc alias set myminio http://localhost:9000 supermark changeme123

# Create bucket if it doesn't exist
echo "Creating bucket..."
mc mb --ignore-existing myminio/supermark-documents

# Set public download policy
echo "Setting bucket policy..."
mc anonymous set download myminio/supermark-documents

# Set CORS policy to allow browser uploads
echo "Setting CORS policy..."
cat > /tmp/minio-cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length"]
    }
  ]
}
EOF

mc anonymous set-json /tmp/minio-cors.json myminio/supermark-documents

echo "✅ MinIO setup complete!"
echo ""
echo "MinIO Console: http://localhost:9001"
echo "MinIO API: http://localhost:9000"
echo "Bucket: supermark-documents"
echo "Credentials: supermark / changeme123"
