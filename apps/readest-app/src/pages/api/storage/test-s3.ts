import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { corsAllMethods, runMiddleware } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsAllMethods);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, accessKeyId, secretAccessKey, region, bucket, pathStyle } = req.body;

    // Validate required fields
    if (!accessKeyId || !secretAccessKey || !bucket) {
      return res.status(400).json({ error: 'Missing required fields: accessKeyId, secretAccessKey, or bucket' });
    }

    // Create S3 client with the provided settings
    const s3Client = new S3Client({
      endpoint: endpoint || undefined,
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: pathStyle || false,
    });

    // Test the connection by sending a HeadBucket command
    const command = new HeadBucketCommand({ Bucket: bucket });
    await s3Client.send(command);

    res.status(200).json({ success: true, message: 'Connection test successful' });
  } catch (error: any) {
    console.error('S3 connection test failed:', error);
    res.status(500).json({
      success: false,
      message: `Connection test failed: ${error.name === 'NoSuchBucket' ? 'Bucket not found' : error.message}`,
    });
  }
}