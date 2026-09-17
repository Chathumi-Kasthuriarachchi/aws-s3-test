require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const {
	S3Client,
	PutObjectCommand,
	ListObjectsV2Command,
	GetObjectCommand,
	DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// Read configuration from .env without putting credentials in source code.
const {
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY,
	AWS_REGION,
	AWS_S3_BUCKET_NAME,
} = process.env;

const requiredVariables = {
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY,
	AWS_REGION,
	AWS_S3_BUCKET_NAME,
};

const missingVariables = Object.entries(requiredVariables)
	.filter(([, value]) => !value || value.startsWith('your-'))
	.map(([name]) => name);

if (missingVariables.length > 0) {
	console.error(`Missing environment variables: ${missingVariables.join(', ')}`);
	console.error('Copy the required values into .env and try again.');
	process.exit(1);
}

const s3Client = new S3Client({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

const command = process.argv[2];
const argument = process.argv[3];

function printUsage() {
	console.log(`
Usage:
	node index.js upload
	node index.js list
	node index.js download <s3-object-key> [local-file-path]
	node index.js delete <s3-object-key>
`);
}

function printAwsError(error) {
	console.error(`Operation failed: ${error.name || 'UnknownError'}`);
	console.error(error.message || error);

	const hints = {
		InvalidAccessKeyId: 'Check AWS_ACCESS_KEY_ID in .env.',
		SignatureDoesNotMatch: 'Check AWS_SECRET_ACCESS_KEY and AWS_REGION in .env.',
		AccessDenied: 'Check that the IAM user can access this bucket and object.',
		NoSuchBucket: 'Check AWS_S3_BUCKET_NAME and confirm the bucket exists.',
		PermanentRedirect: 'The bucket is probably in a different AWS_REGION.',
	};

	if (hints[error.name]) {
		console.error(`Hint: ${hints[error.name]}`);
	}
}

async function uploadTestFile() {
	const filePath = path.join(__dirname, 'test.txt');
	const fileBody = fs.createReadStream(filePath);

	await s3Client.send(new PutObjectCommand({
		Bucket: AWS_S3_BUCKET_NAME,
		Key: 'test.txt',
		Body: fileBody,
		ContentType: 'text/plain',
	}));

	console.log('Upload succeeded: test.txt');
}

async function listObjects() {
	const response = await s3Client.send(new ListObjectsV2Command({
		Bucket: AWS_S3_BUCKET_NAME,
	}));
	const objects = response.Contents || [];

	if (objects.length === 0) {
		console.log('List succeeded: the bucket is empty.');
		return;
	}

	console.log('List succeeded. Objects in the bucket:');
	objects.forEach((object) => {
		console.log(`- ${object.Key} (${object.Size} bytes)`);
	});
}

async function downloadObject() {
	if (!argument) {
		throw new Error('Please provide an S3 object key to download.');
	}

	const localFilePath = process.argv[4] || path.basename(argument);
	const response = await s3Client.send(new GetObjectCommand({
		Bucket: AWS_S3_BUCKET_NAME,
		Key: argument,
	}));

	await pipeline(response.Body, fs.createWriteStream(localFilePath));
	console.log(`Download succeeded: s3://${AWS_S3_BUCKET_NAME}/${argument} -> ${localFilePath}`);
}

async function deleteObject() {
	if (!argument) {
		throw new Error('Please provide an S3 object key to delete.');
	}

	await s3Client.send(new DeleteObjectCommand({
		Bucket: AWS_S3_BUCKET_NAME,
		Key: argument,
	}));

	console.log(`Delete succeeded: ${argument}`);
}

async function main() {
	if (!['upload', 'list', 'download', 'delete'].includes(command)) {
		printUsage();
		process.exitCode = 1;
		return;
	}

	try {
		if (command === 'upload') await uploadTestFile();
		if (command === 'list') await listObjects();
		if (command === 'download') await downloadObject();
		if (command === 'delete') await deleteObject();
	} catch (error) {
		printAwsError(error);
		process.exitCode = 1;
	}
}

main();
