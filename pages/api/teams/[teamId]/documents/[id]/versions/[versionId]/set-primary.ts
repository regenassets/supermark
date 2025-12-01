import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/documents/:id/versions/:versionId/set-primary
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: documentId,
      versionId,
    } = req.query as {
      teamId: string;
      id: string;
      versionId: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
        },
      });

      if (!team) {
        return res.status(401).end("Unauthorized");
      }

      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
          teamId,
        },
        select: {
          id: true,
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Verify the version exists and belongs to this document
      const version = await prisma.documentVersion.findUnique({
        where: {
          id: versionId,
        },
        select: {
          id: true,
          documentId: true,
        },
      });

      if (!version || version.documentId !== documentId) {
        return res.status(404).json({ error: "Version not found" });
      }

      // Set all versions to non-primary
      await prisma.documentVersion.updateMany({
        where: {
          documentId: documentId,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set the specified version as primary
      await prisma.documentVersion.update({
        where: {
          id: versionId,
        },
        data: {
          isPrimary: true,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      log({
        message: `Failed to set primary version for document: _${documentId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}, versionId: ${versionId}}\``,
        type: "error",
      });
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
