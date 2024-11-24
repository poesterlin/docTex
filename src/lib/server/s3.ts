import { env } from '$env/dynamic/private';
import { Client } from 'minio';

const { MINIO_KEY, MINIO_SECRET, MINIO_URL, MINIO_BUCKET, MINIO_PORT } = env;

const client = new Client({
	endPoint: MINIO_URL,
	port: parseInt(MINIO_PORT),
	accessKey: MINIO_KEY,
	secretKey: MINIO_SECRET,
	useSSL: false
});

export async function uploadFile(sha: string, file: File) {
	const buffer = Buffer.from(await file.arrayBuffer());
	await client.putObject(MINIO_BUCKET, sha, buffer);
}

export async function getFileResponseStream(sha: string) {
	const { size } = await client.statObject(MINIO_BUCKET, sha);
	const stream = await client.getObject(MINIO_BUCKET, sha);

	// @ts-expect-error - missing types
	return new Response(stream, {
		headers: {
			'content-size': size,
			'content-type': 'image/webp'
		}
	});
}

export async function downloadFile(sha: string) {
	return client.getObject(MINIO_BUCKET, sha);
}

export async function deleteImage(id: string) {
	await client.removeObject(MINIO_BUCKET, id);
}

export async function sha256(file: File) {
	// metadata
	const name = file.name;
	const mimeType = file.type;
	const version = 0;
	const metaData = [name, mimeType, version].join(':');
	const encoded = new TextEncoder().encode(metaData);

	// content
	const content = await file.arrayBuffer();

	// data = metadata + content
	const data = new Uint8Array(encoded.length + content.byteLength);
	data.set(encoded);
	data.set(new Uint8Array(content), encoded.length);

	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArr = new Uint8Array(hashBuffer);
	const hashString = Array.from(hashArr)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return hashString;
}

export function getFileContent(sha: string) {
	return client.getObject(MINIO_BUCKET, sha);
}

export async function getFileContentString(sha: string) {
	const readable = await client.getObject(MINIO_BUCKET, sha);

	const buffer = await readStreamToBuffer(readable);
	const decoder = new TextDecoder();
	return decoder.decode(buffer);
}

function readStreamToBuffer(readable: any) {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		readable.on('data', (chunk: Buffer) => {
			chunks.push(chunk);
		});
		readable.on('end', () => {
			resolve(Buffer.concat(chunks));
		});
		readable.on('error', reject);
	});
}
