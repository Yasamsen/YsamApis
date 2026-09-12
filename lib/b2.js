const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Backblaze B2 via S3-compatible API
 *
 * Required env:
 *   B2_KEY_ID
 *   B2_APPLICATION_KEY
 *   B2_BUCKET_NAME
 *   B2_REGION          (e.g. us-west-004)
 * Optional:
 *   B2_ENDPOINT        (override, default: https://s3.<region>.backblazeb2.com)
 */

let b2Client = null;

function getB2Client() {
  if (b2Client) return b2Client;

  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  const region = process.env.B2_REGION || 'us-west-004';

  if (!keyId || !appKey) {
    throw new Error('B2 credentials (B2_KEY_ID, B2_APPLICATION_KEY) are required');
  }

  const endpoint = process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`;

  b2Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
    forcePathStyle: true,
  });

  return b2Client;
}

function getBucketName() {
  const name = process.env.B2_BUCKET_NAME;
  if (!name) throw new Error('B2_BUCKET_NAME is required');
  return name;
}

async function uploadToB2(storageKey, buffer, mimeType) {
  const client = getB2Client();
  const bucket = getBucketName();

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream',
  }));

  return storageKey;
}

async function getB2Stream(storageKey) {
  const client = getB2Client();
  const bucket = getBucketName();

  const response = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  }));

  return {
    stream: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}

async function deleteFromB2(storageKey) {
  const client = getB2Client();
  const bucket = getBucketName();

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  }));
}

async function headB2Object(storageKey) {
  const client = getB2Client();
  const bucket = getBucketName();

  try {
    return await client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }));
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

module.exports = {
  uploadToB2,
  getB2Stream,
  deleteFromB2,
  headB2Object,
  getB2Client,
  getBucketName,
};
