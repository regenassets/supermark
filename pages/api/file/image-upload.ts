import type { NextApiRequest, NextApiResponse } from "next";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth/next";
import slugify from "@sindresorhus/slugify";
import crypto from "crypto";
import path from "node:path";

import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";

import { authOptions } from "../auth/[...nextauth]";

const uploadConfig = {
  profile: {
    allowedContentTypes: ["image/png", "image/jpg", "image/jpeg"],
    maximumSizeInBytes: 2 * 1024 * 1024, // 2MB
  },
  assets: {
    allowedContentTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/x-icon",
      "image/ico",
    ],
    maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
  },
};

// image-upload/?type= "profile" | "assets"
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const type = Array.isArray(req.query.type)
    ? req.query.type[0]
    : req.query.type;

  if (!type || !(type in uploadConfig)) {
    return res.status(400).json({ error: "Invalid upload type specified." });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const config = uploadConfig[type as keyof typeof uploadConfig];

    // Get file from request body
    const { file, teamId } = req.body;

    if (!file || !teamId) {
      return res.status(400).json({ error: "Missing file or teamId" });
    }

    // Verify user has access to team
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: (session.user as CustomUser).id,
          },
        },
      },
      select: { id: true },
    });

    if (!team) {
      return res.status(403).json({ error: "Unauthorized to access this team" });
    }

    // Decode base64 file data
    const matches = file.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid file format" });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Validate content type
    if (!config.allowedContentTypes.includes(contentType)) {
      return res.status(400).json({
        error: `File type not supported. Allowed types: ${config.allowedContentTypes.join(", ")}`
      });
    }

    // Validate file size
    if (buffer.length > config.maximumSizeInBytes) {
      return res.status(400).json({
        error: `File size too large. Maximum: ${config.maximumSizeInBytes / 1024 / 1024}MB`
      });
    }

    const NEXT_PUBLIC_UPLOAD_TRANSPORT = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

    if (NEXT_PUBLIC_UPLOAD_TRANSPORT !== "s3") {
      return res.status(500).json({ error: "S3 storage not configured" });
    }

    const { client, config: s3Config } = await getTeamS3ClientAndConfig(teamId);

    // Generate unique file name
    const fileId = crypto.randomUUID().replace(/-/g, "");
    const extension = contentType.split("/")[1] || "png";
    const fileName = `${type}-${fileId}.${extension}`;
    const key = `${teamId}/images/${fileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    // Construct public URL
    // For MinIO/S3, construct URL based on endpoint
    let url: string;
    if (s3Config.endpoint) {
      // MinIO or custom S3 endpoint
      url = `${s3Config.endpoint}/${s3Config.bucket}/${key}`;
    } else {
      // AWS S3
      url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
    }

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
}
