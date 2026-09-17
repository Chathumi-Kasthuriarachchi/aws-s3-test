# AWS S3 Node.js Test

This is a small standalone command-line project for learning and testing Amazon S3 before adding S3 to a larger MERN application.

## What is S3?

Amazon Simple Storage Service (S3) stores files as **objects** inside **buckets**. Each object has a key, which is its name or path inside the bucket. S3 buckets are private by default. This project does not make the bucket or its files public.

## What this project does

`index.js` uses the official AWS SDK for JavaScript v3 and these S3 commands:

- `PutObjectCommand` uploads `test.txt`.
- `ListObjectsV2Command` lists objects in the bucket.
- `GetObjectCommand` downloads one object to your computer.
- `DeleteObjectCommand` deletes one object.

The program performs one operation each time you run it. It does not use Express or Cloudinary.

## Install dependencies

From this project folder, run:

```bash
npm install
```

The project uses:

- `@aws-sdk/client-s3`
- `dotenv`

## Configure `.env`

Open `.env` and replace the placeholder values with your own AWS values:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET_NAME=your-bucket-name
```

Use an IAM user or role with only the S3 permissions needed for this test. Never commit `.env`, share its contents, or hard-code credentials in JavaScript. The `.gitignore` file already excludes `.env`.

If real credentials were accidentally exposed, deactivate or rotate them in IAM immediately and create replacement credentials.

## Run each test

Upload the local `test.txt` file to the bucket with the S3 object key `test.txt`:

```bash
node index.js upload
```

List the objects in the bucket:

```bash
node index.js list
```

Download an object. The second argument is the S3 object key. The optional third argument is the local destination path:

```bash
node index.js download test.txt downloaded-test.txt
```

If the local destination is omitted, the object key's file name is used:

```bash
node index.js download test.txt
```

Delete an object by its S3 object key:

```bash
node index.js delete test.txt
```

The same commands can be run through the start script, for example `npm start -- list`.

## Example successful output

The exact list of objects and byte counts will vary:

```text
Upload succeeded: test.txt

List succeeded. Objects in the bucket:
- test.txt (52 bytes)

Download succeeded: s3://your-bucket-name/test.txt -> downloaded-test.txt

Delete succeeded: test.txt
```

## Common errors

- **Missing environment variables**: replace every `your-...` placeholder in `.env`.
- **Invalid credentials** or `InvalidAccessKeyId`: check the access key ID and secret access key. Rotate credentials if they were exposed.
- **AccessDenied**: the IAM identity does not have the required permission, such as `s3:PutObject`, `s3:ListBucket`, `s3:GetObject`, or `s3:DeleteObject`.
- **NoSuchBucket**: check the bucket name and confirm that it exists.
- **Wrong AWS region** or `PermanentRedirect`: set `AWS_REGION` to the bucket's actual region.
- **NoSuchKey**: the object key does not exist. Run the list command and copy the key exactly.

Keep the bucket private. Do not add a public bucket policy or disable S3 Block Public Access for this test.

## Safely clean up test files

After testing, delete the uploaded object:

```bash
node index.js delete test.txt
```

You can confirm it is gone with:

```bash
node index.js list
```

The local `test.txt` file is only a fixture. You may delete it from this project after testing, and you may delete any downloaded local copy such as `downloaded-test.txt`. Deleting an S3 object is permanent unless bucket versioning or another recovery process is enabled.
