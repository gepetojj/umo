"use server";

import { randomUUID } from "node:crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../../env";
import { s3 } from "../../s3";

const UPLOAD_EXPIRES_IN = 60; // 1 minuto

export const getUploadUrl = async (meetingId: string) => {
	const objectKey = `meetings/${meetingId}/${randomUUID()}`;

	const command = new PutObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: objectKey,
	});

	const url = await getSignedUrl(s3, command, {
		expiresIn: UPLOAD_EXPIRES_IN,
	});

	return { url, key: objectKey };
};
