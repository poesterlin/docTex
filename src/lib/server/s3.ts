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
	const metaData = {
		'content-type': file.type
	};
	await client.putObject(MINIO_BUCKET, sha, buffer, undefined, metaData);
}

export async function getFileResponseStream(sha: string, asDownload: boolean = false) {
	const { size, metaData } = await client.statObject(MINIO_BUCKET, sha);
	const stream = await client.getObject(MINIO_BUCKET, sha);

	// @ts-expect-error - missing types
	return new Response(stream, {
		headers: {
			'content-size': size,
			'content-type': metaData['content-type'],
			'content-disposition': asDownload ? 'attachment' : 'inline'
			// 'cache-control': 'public, max-age=31536000, immutable',
		}
	});
}

export async function uploadFileFromPath(sha: string, path: string) {
	client.fPutObject(MINIO_BUCKET, sha, path);
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

export function downloadFileToPath(sha: string, path: string) {
	return client.fGetObject(MINIO_BUCKET, sha, path);
}

export async function getFileContentString(sha: string) {
	const readable = await client.getObject(MINIO_BUCKET, sha);

	const buffer = await readStreamToBuffer(readable);
	const decoder = new TextDecoder();
	return decoder.decode(buffer);
}

export async function hasFile(sha: string) {
	try {
		await client.statObject(MINIO_BUCKET, sha);
		return true;
	} catch (error) {
		return false;
	}
}

export function readStreamToBuffer(readable: any) {
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
