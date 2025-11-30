import { NextApiRequest, NextApiResponse } from "next";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth";
import path from "node:path";
import formidable from "formidable";
import fs from "fs/promises";

import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

// Disable Next.js body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Extract form fields
    const teamId = fields.teamId?.[0];
    const docId = fields.docId?.[0];

    if (!teamId || !docId) {
      return res.status(400).json({ error: "Missing teamId or docId" });
    }

    // Verify team access
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

    // Get the uploaded file
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = fileArray[0];
    const originalFileName = file.originalFilename || "unnamed";
    const { name, ext } = path.parse(originalFileName);
    const slugifiedName = slugify(name) + ext;
    const key = `${team.id}/${docId}/${slugifiedName}`;

    // Get S3 client and config
    const { client, config } = await getTeamS3ClientAndConfig(team.id);

    // Read file contents
    const fileBuffer = await fs.readFile(file.filepath);

    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: file.mimetype || "application/octet-stream",
      ContentDisposition: `attachment; filename="${slugifiedName}"`,
    });

    await client.send(putCommand);

    // Clean up temporary file
    await fs.unlink(file.filepath);

    return res.status(200).json({
      key,
      fileName: slugifiedName,
      size: file.size,
    });
  } catch (error) {
    console.error("Server-side upload error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
