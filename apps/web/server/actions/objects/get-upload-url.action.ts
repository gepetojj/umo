"use server";

import { randomUUID } from "node:crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getUploadUrlSchema } from "@/server/actions/objects/schemas/get-upload-url.schema";
import { paidActionClient } from "@/server/actions/safe-action";
import { env } from "@/server/env";
import { s3 } from "@/server/s3";

const UPLOAD_EXPIRES_IN = 60;

export const getUploadUrlAction = paidActionClient
	.inputSchema(getUploadUrlSchema)
	.action(async ({ parsedInput: { meetingId } }) => {
		const objectKey = `meetings/${meetingId}/${randomUUID()}`;

		const command = new PutObjectCommand({
			Bucket: env.S3_BUCKET,
			Key: objectKey,
		});

		const url = await getSignedUrl(s3, command, {
			expiresIn: UPLOAD_EXPIRES_IN,
		});

		return { url, key: objectKey };
	});
