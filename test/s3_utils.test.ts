import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { s3, BUCKET_NAME, streamToBuffer } from '../src/s3_utils';

describe('s3_utils', () => {
    let addedObjects: string[] = [];

    beforeEach(() => {
        addedObjects = [];
    });

    afterEach(async () => {
        for (const key of addedObjects) {
            await s3.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }));
        }
    });

    describe('s3 client', () => {
        it('should be an instance of S3Client', () => {
            expect(s3).toBeInstanceOf(S3Client);
        });

        it('should have the correct region', async () => {
            const region = await s3.config.region();
            expect(region).toBe('us-east-1');
        });
    });

    describe('BUCKET_NAME', () => {
        it('should be defined', () => {
            expect(BUCKET_NAME).toBeDefined();
        });

        it('should have the correct bucket name', () => {
            expect(BUCKET_NAME).toBe('ece461-zipped-packages');
        });
    });

    describe('streamToBuffer', () => {
        it('should convert stream to buffer', async () => {
            const data = 'Hello, world!';
            const stream = new Readable();
            stream.push(data);
            stream.push(null);

            const buffer = await streamToBuffer(stream);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.toString()).toBe(data);
        });

        it('should handle stream errors', async () => {
            const stream = new Readable();
            const error = new Error('Stream error');

            process.nextTick(() => stream.emit('error', error));

            await expect(streamToBuffer(stream)).rejects.toThrow('Stream error');
        });
    });
});