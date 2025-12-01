import { NextResponse } from "next/server";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { getSlackInstallationUrl } from "@/lib/integrations/slack/install";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { getSearchParams } from "@/lib/utils/get-search-params";

const oAuthAuthorizeSchema = z.object({
  teamId: z.string().cuid(),
  provider: z
    .enum(["slack", "mattermost", "discord"])
    .optional()
    .default("mattermost"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, provider } = oAuthAuthorizeSchema.parse(
      getSearchParams(req.url),
    );
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get provider-specific OAuth URL
    // For now, all providers use the same installation URL function
    // In the future, this can be expanded to support different providers
    const oauthUrl = await getSlackInstallationUrl(teamId);

    return NextResponse.json({
      oauthUrl,
      provider, // Include provider in response for tracking
    });
  } catch (error) {
    console.error("OAuth authorization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
