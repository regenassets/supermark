import prisma from "@/lib/prisma";

import { MattermostEventData, MattermostMessage } from "./types";

/**
 * Helper function to safely reference a link with fallback handling
 */
function linkRef(
  link: { name?: string | null; id?: string } | null | undefined,
): string {
  if (link?.name) {
    return `"${link.name}"`;
  }
  return `"Link ${link?.id?.slice(0, 5) ?? "unknown"}"`;
}

export async function createMattermostMessage(
  eventData: MattermostEventData,
): Promise<MattermostMessage | null> {
  try {
    switch (eventData.eventType) {
      case "document_view":
        return await createDocumentViewMessage(eventData);
      case "dataroom_access":
        return await createDataroomAccessMessage(eventData);
      case "document_download":
        return await createDocumentDownloadMessage(eventData);

      default:
        return null;
    }
  } catch (error) {
    console.error("Error creating Mattermost message:", error);
    return null;
  }
}

/**
 * Document View Message Template
 * Mattermost uses markdown format
 */
async function createDocumentViewMessage(
  eventData: MattermostEventData,
): Promise<MattermostMessage> {
  const document = eventData.documentId
    ? await getDocumentInfo(eventData.documentId)
    : null;
  const dataroom = eventData.dataroomId
    ? await getDataroomInfo(eventData.dataroomId)
    : null;
  const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

  const viewerDisplay = eventData.viewerEmail || "Anonymous";

  let accessContext = "";
  if (eventData.dataroomId && dataroom) {
    accessContext = `in dataroom "${dataroom.name}"`;
  } else {
    accessContext = `via shared link ${linkRef(link)}`;
  }

  const documentUrl = eventData.documentId
    ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
    : `${process.env.NEXTAUTH_URL}/dashboard`;

  const text = `
### 📄 Your document has been viewed

**Document:** ${document?.name || "Unknown"}
**Viewer:** ${viewerDisplay}
${dataroom?.name ? `**Dataroom:** ${dataroom.name}` : link?.name ? `**Shared Link:** ${link.name}` : `**Access:** Direct access`}
**Time:** ${new Date().toLocaleString()}

${eventData.dataroomId ? `Viewed document in dataroom "${dataroom?.name || "Unknown"}"` : `Viewed document via shared link ${linkRef(link)}`}

[View document](${documentUrl})
  `.trim();

  return {
    text,
    username: "Supermark",
  };
}

/**
 * Dataroom Access Message Template
 */
async function createDataroomAccessMessage(
  eventData: MattermostEventData,
): Promise<MattermostMessage> {
  const dataroom = eventData.dataroomId
    ? await getDataroomInfo(eventData.dataroomId)
    : null;
  const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

  const viewerDisplay = eventData.viewerEmail || "Anonymous";
  const dataroomUrl = eventData.dataroomId
    ? `${process.env.NEXTAUTH_URL}/datarooms/${eventData.dataroomId}`
    : `${process.env.NEXTAUTH_URL}/dashboard`;

  const text = `
### 🗂️ Your dataroom has been viewed

**Dataroom:** ${dataroom?.name || "Unknown"}
**Viewer:** ${viewerDisplay}
${link?.name ? `**Shared Link:** ${link.name}` : `**Access:** Direct access`}
**Time:** ${new Date().toLocaleString()}
**Documents:** ${dataroom?.documentCount || 0} documents

Dataroom accessed via shared link ${linkRef(link)}

[View dataroom](${dataroomUrl})
  `.trim();

  return {
    text,
    username: "Supermark",
  };
}

/**
 * Document Download Message Template
 */
async function createDocumentDownloadMessage(
  eventData: MattermostEventData,
): Promise<MattermostMessage> {
  const document = eventData.documentId
    ? await getDocumentInfo(eventData.documentId)
    : null;
  const dataroom = eventData.dataroomId
    ? await getDataroomInfo(eventData.dataroomId)
    : null;
  const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

  const viewerDisplay = eventData.viewerEmail || "Anonymous";

  const isBulkDownload = eventData.metadata?.isBulkDownload;
  const isFolderDownload = eventData.metadata?.isFolderDownload;
  const folderName = eventData.metadata?.folderName;
  const documentCount = eventData.metadata?.documentCount;

  let downloadType = "Document";
  let downloadContext = "";
  let downloadIcon = "📥";

  if (isBulkDownload) {
    downloadType = "Dataroom";
    downloadContext = `(${documentCount} documents)`;
    downloadIcon = "📦";
  } else if (isFolderDownload) {
    downloadType = "Folder";
    downloadContext = `"${folderName}" (${documentCount} documents)`;
    downloadIcon = "📁";
  } else if (dataroom) {
    downloadContext = `from dataroom "${dataroom.name}"`;
  } else {
    downloadContext = `via shared link ${linkRef(link)}`;
  }

  const activityUrl = eventData.dataroomId
    ? `${process.env.NEXTAUTH_URL}/datarooms/${eventData.dataroomId}`
    : eventData.documentId
      ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
      : `${process.env.NEXTAUTH_URL}/dashboard`;

  const text = `
### ${downloadIcon} ${downloadType} has been downloaded

**${downloadType}:** ${document?.name || downloadContext}
**Downloaded by:** ${viewerDisplay}
${dataroom?.name ? `**From Dataroom:** ${dataroom.name}` : link?.name ? `**Shared Link:** ${link.name}` : `**Context:** ${downloadContext}`}
**Time:** ${new Date().toLocaleString()}

${isBulkDownload ? `Bulk dataroom download` : isFolderDownload ? `Folder download` : `Document download via shared link ${linkRef(link)}`}

[View activity](${activityUrl})
  `.trim();

  return {
    text,
    username: "Supermark",
  };
}

// Helper functions (reused from Slack templates)
async function getDocumentInfo(documentId: string) {
  try {
    return await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
      },
    });
  } catch (error) {
    console.error("Error fetching document info:", error);
    return null;
  }
}

async function getDataroomInfo(dataroomId: string) {
  try {
    return await prisma.dataroom
      .findUnique({
        where: { id: dataroomId },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      })
      .then((dataroom) =>
        dataroom
          ? {
              ...dataroom,
              documentCount: dataroom._count.documents,
            }
          : null,
      );
  } catch (error) {
    console.error("Error fetching dataroom info:", error);
    return null;
  }
}

async function getLinkInfo(linkId: string) {
  try {
    return await prisma.link.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        name: true,
        linkType: true,
      },
    });
  } catch (error) {
    console.error("Error fetching link info:", error);
    return null;
  }
}
