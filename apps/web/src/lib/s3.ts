import { S3Client } from '@aws-sdk/client-s3'

// If endpoint is provided, we're likely using MinIO or Cloudflare R2
// Otherwise, AWS standard defaults apply
export const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // Necessary for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

export const S3_BUCKET = process.env.S3_BUCKET || 'lva-uploads'
