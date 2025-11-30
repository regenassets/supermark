import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  type: string;
  file: string;
  numPages: number | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  contentType: string | null;
  fileSize: bigint | null;
  length: number | null;
}

interface DocumentVersionsResponse {
  versions: DocumentVersion[];
}

export function useDocumentVersions() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data, error, mutate } = useSWR<DocumentVersionsResponse>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}/versions`,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  return {
    versions: data?.versions || [],
    loading: !error && !data,
    error,
    mutate,
  };
}
