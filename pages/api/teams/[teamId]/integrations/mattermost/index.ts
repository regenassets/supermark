import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import {
  MattermostConfiguration,
  MattermostCredential,
  MattermostCredentialPublic,
} from "@/lib/integrations/mattermost/types";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

const mattermostConfigurationSchema = z.object({
  enabled: z.boolean().optional(),
  notificationTypes: z
    .array(z.enum(["document_view", "document_download", "dataroom_access"]))
    .optional(),
});

const mattermostInstallSchema = z.object({
  webhookUrl: z.string().url(),
  channelName: z.string().optional(),
  teamName: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  const userTeam = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  if (!userTeam) {
    return res.status(403).json({ error: "Access denied" });
  }

  switch (req.method) {
    case "GET":
      return handleGet(req, res, teamId);
    case "POST":
      return handleInstall(req, res, teamId, userId);
    case "PUT":
      return handleUpdate(req, res, teamId);
    case "DELETE":
      return handleDelete(req, res, teamId);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  teamId: string,
) {
  try {
    // Find Mattermost integration
    const mattermostIntegration = await prisma.integration.findUnique({
      where: {
        slug: "mattermost",
      },
      select: {
        id: true,
      },
    });

    if (!mattermostIntegration) {
      return res.status(200).json({
        installed: false,
        enabled: false,
      });
    }

    const integrationFullData = await prisma.installedIntegration.findUnique({
      where: {
        teamId_integrationId: {
          teamId,
          integrationId: mattermostIntegration.id,
        },
      },
      select: {
        id: true,
        credentials: true,
        configuration: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integrationFullData) {
      return res.status(200).json({
        installed: false,
        enabled: false,
      });
    }

    const credentials = integrationFullData.credentials as MattermostCredential;
    const integration = {
      ...integrationFullData,
      credentials: {
        channelName: credentials?.channelName,
        teamName: credentials?.teamName,
      } as MattermostCredentialPublic,
    };

    return res.status(200).json(integration);
  } catch (error) {
    console.error("Error fetching Mattermost integration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleInstall(
  req: NextApiRequest,
  res: NextApiResponse,
  teamId: string,
  userId: string,
) {
  try {
    const validationResult = mattermostInstallSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: validationResult.error.errors,
      });
    }

    const { webhookUrl, channelName, teamName } = validationResult.data;

    // Find Mattermost integration
    const mattermostIntegration = await prisma.integration.findUnique({
      where: {
        slug: "mattermost",
      },
      select: {
        id: true,
      },
    });

    if (!mattermostIntegration) {
      return res
        .status(404)
        .json({ error: "Mattermost integration not found" });
    }

    const credentials: MattermostCredential = {
      webhookUrl,
      channelName,
      teamName,
    };

    const configuration: MattermostConfiguration = {
      enabled: true,
      notificationTypes: [
        "document_view",
        "document_download",
        "dataroom_access",
      ],
    };

    const installation = await prisma.installedIntegration.upsert({
      where: {
        teamId_integrationId: {
          teamId,
          integrationId: mattermostIntegration.id,
        },
      },
      create: {
        teamId,
        userId,
        integrationId: mattermostIntegration.id,
        credentials,
        configuration,
        enabled: true,
      },
      update: {
        credentials,
        configuration,
        enabled: true,
      },
      select: {
        id: true,
        credentials: true,
        configuration: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const integrationResponse = {
      ...installation,
      credentials: {
        channelName: credentials.channelName,
        teamName: credentials.teamName,
      } as MattermostCredentialPublic,
    };

    return res.status(200).json(integrationResponse);
  } catch (error) {
    console.error("Error installing Mattermost integration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  teamId: string,
) {
  try {
    const validationResult = mattermostConfigurationSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: validationResult.error.errors,
      });
    }

    const { enabled, notificationTypes } = validationResult.data;

    // Find Mattermost integration
    const mattermostIntegration = await prisma.integration.findUnique({
      where: {
        slug: "mattermost",
      },
      select: {
        id: true,
      },
    });

    if (!mattermostIntegration) {
      return res
        .status(404)
        .json({ error: "Mattermost integration not found" });
    }

    const updateData: any = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (notificationTypes !== undefined) {
      updateData.configuration = { enabled: true, notificationTypes };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedIntegrationData = await prisma.installedIntegration.update({
      where: {
        teamId_integrationId: {
          teamId,
          integrationId: mattermostIntegration.id,
        },
      },
      data: updateData,
      select: {
        id: true,
        credentials: true,
        configuration: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const credentials =
      updatedIntegrationData.credentials as MattermostCredential;
    const updatedIntegration = {
      ...updatedIntegrationData,
      credentials: {
        channelName: credentials?.channelName,
        teamName: credentials?.teamName,
      } as MattermostCredentialPublic,
    };

    return res.status(200).json(updatedIntegration);
  } catch (error) {
    console.error("Error updating Mattermost integration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  teamId: string,
) {
  try {
    // Find Mattermost integration
    const mattermostIntegration = await prisma.integration.findUnique({
      where: {
        slug: "mattermost",
      },
      select: {
        id: true,
      },
    });

    if (!mattermostIntegration) {
      return res
        .status(404)
        .json({ error: "Mattermost integration not found" });
    }

    await prisma.installedIntegration.delete({
      where: {
        teamId_integrationId: {
          teamId,
          integrationId: mattermostIntegration.id,
        },
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting Mattermost integration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
