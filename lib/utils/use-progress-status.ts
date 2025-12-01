"use client";

import { type RunStatus } from "@trigger.dev/core/v3";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";

import { parseStatus } from "@/lib/utils/generate-trigger-status";

interface IDocumentProgressStatus {
  state: RunStatus;
  progress: number;
  text: string;
}

export function useDocumentProgressStatus(
  documentVersionId: string,
  publicAccessToken: string | undefined,
) {
  const { runs, error } = useRealtimeRunsWithTag(
    `version:${documentVersionId}`,
    {
      enabled: !!publicAccessToken,
      accessToken: publicAccessToken,
    },
  );

  // Find the most recent active run (PENDING_VERSION, QUEUED, DEQUEUED, EXECUTING, or WAITING)
  const activeRun = runs.find((run) =>
    ["PENDING_VERSION", "QUEUED", "DEQUEUED", "EXECUTING", "WAITING"].includes(
      run.status,
    ),
  );

  const status: IDocumentProgressStatus = {
    state: "QUEUED",
    progress: 0,
    text: "Initializing...",
  };

  // If we have no runs at all
  if (runs.length === 0) {
    // If Trigger is not configured, mark as completed so UI doesn't show endless loading
    if (!publicAccessToken) {
      status.state = "COMPLETED";
      status.progress = 100;
      status.text = "Processing complete";
    }
    return { status, error, run: undefined };
  }

  // If we found an active run, use its status
  if (activeRun) {
    status.state = activeRun.status;

    // Show friendly message for PENDING_VERSION state
    if (activeRun.status === "PENDING_VERSION") {
      status.progress = 0;
      status.text = "Waiting for worker to connect...";
    } else if (activeRun.metadata) {
      const { progress, text } = parseStatus(activeRun.metadata);
      status.progress = progress;
      status.text = text;
    }
    return { status, error, run: activeRun };
  }

  // Check if any run has failed
  const failedRun = runs.find((run) =>
    ["FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE"].includes(run.status),
  );

  if (failedRun) {
    status.state = failedRun.status;
    if (failedRun.metadata) {
      const { progress, text } = parseStatus(failedRun.metadata);
      status.progress = progress;
      status.text = text;
    }
    return { status, error, run: failedRun };
  }

  // If all runs are completed
  const allCompleted = runs.every((run) => run.status === "COMPLETED");
  if (allCompleted) {
    status.state = "COMPLETED";
    status.progress = 100;
    status.text = "Processing complete";
  }

  return {
    status,
    error,
    run: runs[0], // Return most recent run
  };
}
