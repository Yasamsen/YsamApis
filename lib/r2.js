const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Readable } = require('stream');

let r2Client = null;

function getR2Client() {
  if (r2Client) return r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are required');
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

function getBucketName() {
  const name = process.env.R2_BUCKET_NAME;
  if (!name) throw new Error('R2_BUCKET_NAME is required');
  return name;
}

async function uploadToR2(storageKey, buffer, mimeType) {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream',
  });

  await client.send(command);
  return storageKey;
}

async function getFromR2(storageKey) {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  const response = await client.send(command);
  const stream = response.Body;

  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function getR2Stream(storageKey) {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  const response = await client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}

async function deleteFromR2(storageKey) {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  await client.send(command);
}

async function getSignedDownloadUrl(storageKey, expiresIn = 300) {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  return getSignedUrl(client, command, { expiresIn });
}

async function headObject(storageKey) {
  const client = getR2Client();
  const bucket = getBucketName();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    });
    return await client.send(command);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

module.exports = {
  uploadToR2,
  getFromR2,
  getR2Stream,
  deleteFromR2,
  getSignedDownloadUrl,
  headObject,
  getR2Client,
  getBucketName,
};
