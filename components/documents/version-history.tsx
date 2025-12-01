import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { CheckIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";

import { useDocumentVersions } from "@/lib/swr/use-document-versions";
import { timeAgo } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function VersionHistory({ documentId }: { documentId: string }) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { versions, loading, mutate } = useDocumentVersions();
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  const handleSetPrimary = async (versionId: string) => {
    if (!teamId) return;

    setSettingPrimary(versionId);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${encodeURIComponent(
          documentId,
        )}/versions/${versionId}/set-primary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        toast.error("Failed to set primary version");
        return;
      }

      // Mutate the versions list to reflect the change
      await mutate();

      toast.success("Primary version updated successfully");
    } catch (error) {
      toast.error("An error occurred while updating the primary version");
    } finally {
      setSettingPrimary(null);
    }
  };

  const formatFileSize = (bytes: bigint | null) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const numBytes = Number(bytes);
    if (numBytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return (
      Math.round((numBytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
    );
  };

  const getFileTypeDisplay = (
    type: string,
    numPages: number | null,
    length: number | null,
  ) => {
    if (type === "video") {
      const minutes = length ? Math.floor(length / 60) : 0;
      const seconds = length ? length % 60 : 0;
      return `Video (${minutes}:${seconds.toString().padStart(2, "0")})`;
    }
    if (numPages) {
      return `${type.toUpperCase()} (${numPages} ${numPages === 1 ? "page" : "pages"})`;
    }
    return type.toUpperCase();
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-2 md:mb-4">
          <h2>Version History</h2>
        </div>
        <div className="space-y-2 rounded-md border p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-2 md:mb-4">
          <h2>Version History</h2>
        </div>
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No versions found
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 md:mb-4">
        <h2>Version History</h2>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="*:whitespace-nowrap *:font-medium hover:bg-transparent">
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      v{version.versionNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {getFileTypeDisplay(
                      version.type,
                      version.numPages,
                      version.length,
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(version.fileSize)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {timeAgo(version.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {timeAgo(version.updatedAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {version.isPrimary ? (
                    <Badge variant="default" className="gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Current
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(version.id)}
                      disabled={settingPrimary !== null}
                    >
                      {settingPrimary === version.id
                        ? "Setting..."
                        : "Set as Current"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
