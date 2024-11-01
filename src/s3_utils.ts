import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = "ece461-zipped-packages";

const streamToBuffer = (stream: Readable): Promise<Buffer> => { // Convert stream to buffer. allows for downloading files from s3
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

export { s3, BUCKET_NAME, streamToBuffer };