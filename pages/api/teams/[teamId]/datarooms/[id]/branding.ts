import { NextApiRequest, NextApiResponse } from "next";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import { getTeamS3ClientAndConfig } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: (session.user as CustomUser).id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return res.status(403).end("Unauthorized to access this team");
    }

    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      return res.status(404).end("Dataroom not found");
    }
  } catch (error) {
    errorhandler(error, res);
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/branding
    const brand = await prisma.dataroomBrand.findUnique({
      where: {
        dataroomId,
      },
    });

    if (!brand) {
      return res.status(200).json(null);
    }

    return res.status(200).json(brand);
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/branding
    const { logo, banner, brandColor, accentColor, welcomeMessage } = req.body as {
      logo?: string;
      banner?: string;
      brandColor?: string;
      accentColor?: string;
      welcomeMessage?: string;
    };

    // update team with new branding
    const brand = await prisma.dataroomBrand.create({
      data: {
        logo,
        banner,
        brandColor,
        accentColor,
        welcomeMessage,
        dataroomId,
      },
    });

    return res.status(200).json(brand);
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/datarooms/:id/branding
    const { logo, banner, brandColor, accentColor, welcomeMessage } = req.body as {
      logo?: string;
      banner?: string;
      brandColor?: string;
      accentColor?: string;
      welcomeMessage?: string;
    };

    const brand = await prisma.dataroomBrand.update({
      where: {
        dataroomId,
      },
      data: {
        logo,
        banner,
        brandColor,
        accentColor,
        welcomeMessage,
      },
    });

    return res.status(200).json(brand);
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/:id/branding
    const brand = await prisma.dataroomBrand.findFirst({
      where: {
        dataroomId,
      },
      select: { id: true, logo: true, banner: true },
    });

    const NEXT_PUBLIC_UPLOAD_TRANSPORT = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

    if (brand && brand.logo) {
      if (NEXT_PUBLIC_UPLOAD_TRANSPORT === "s3") {
        // Extract S3 key from URL
        const urlMatch = brand.logo.match(/\/(.*)/);
        if (urlMatch) {
          const key = urlMatch[1];
          const { client, config } = await getTeamS3ClientAndConfig(teamId);
          await client.send(new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }));
        }
      } else {
        // Vercel Blob
        await del(brand.logo);
      }
    }

    if (brand && brand.banner && brand.banner !== "no-banner") {
      if (NEXT_PUBLIC_UPLOAD_TRANSPORT === "s3") {
        // Extract S3 key from URL
        const urlMatch = brand.banner.match(/\/(.*)/);
        if (urlMatch) {
          const key = urlMatch[1];
          const { client, config } = await getTeamS3ClientAndConfig(teamId);
          await client.send(new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }));
        }
      } else {
        // Vercel Blob
        await del(brand.banner);
      }
    }

    // delete the branding from database
    await prisma.dataroomBrand.delete({
      where: {
        id: brand?.id,
      },
    });

    return res.status(204).end();
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
