import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/lib/ee-stubs/stripe";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Templates feature disabled - removed unused imports
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";

export function AddDataroomModal({
  children,
  openModal = false,
  setOpenModal,
}: {
  children?: React.ReactNode;
  openModal?: boolean;
  setOpenModal?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [dataroomName, setDataroomName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(openModal);
  // Templates feature disabled - removed activeTab state
  // const [activeTab, setActiveTab] = useState<string>("create");
  // const [dataroomType, setDataroomType] = useState<string>("");

  const teamInfo = useTeam();
  const { isFree, isPro } = usePlan();
  const analytics = useAnalytics();

  // Templates feature disabled
  // const useTemplate = activeTab === "generate";
  const useTemplate = false;

  const dataroomSchema = z.object({
    name: z.string().trim().min(3, {
      message: "Please provide a dataroom name with at least 3 characters.",
    }),
    type: z.string().optional(),
  });

  // Templates feature disabled - removed schema for template type
  // const dataroomSchemaWithType = z.object({
  //   name: z.string().trim().optional(),
  //   type: z.enum(
  //     [
  //       "startup-fundraising",
  //       "raising-first-fund",
  //       "ma-acquisition",
  //       "series-a-plus",
  //       "real-estate-transaction",
  //       "fund-management",
  //       "portfolio-management",
  //       "project-management",
  //       "sales-dataroom",
  //     ],
  //     {
  //       errorMap: () => ({ message: "Please select a dataroom type." }),
  //     },
  //   ),
  // });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Templates feature disabled - simplified validation
    const validation = dataroomSchema.safeParse({
      name: dataroomName,
    });

    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);

    try {
      // Templates feature disabled - use standard endpoint only
      const endpoint = `/api/teams/${teamInfo?.currentTeam?.id}/datarooms`;
      const body = { name: dataroomName.trim() };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { dataroom } = await response.json();

      analytics.capture("Dataroom Created", {
        dataroomName: dataroomName,
      });

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms`);
      toast.success("Dataroom successfully created! 🎉");
      router.push(`/datarooms/${dataroom.id}/documents`);
    } catch (error) {
      setLoading(false);
      toast.error("Error adding dataroom. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen(false);
      if (openModal && setOpenModal) setOpenModal(false);
    }
  };

  // AGPL: All features enabled - datarooms available to all
  /* Commented out for AGPL version
  if (isFree || isPro) {
    if (children) {
      return (
        <UpgradePlanModal
          clickedPlan={PlanEnum.DataRooms}
          trigger={"add_dataroom_overview"}
        >
          {children}
        </UpgradePlanModal>
      );
    }
  }
  */

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setOpen(false);
      setDataroomName("");
      // Templates feature disabled - removed state resets
      // setActiveTab("create");
      // setDataroomType("");
    } else {
      setOpen(true);
    }
    if (openModal && setOpenModal) setOpenModal(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-none bg-transparent text-foreground shadow-none sm:max-w-[500px] [&>button]:hidden">
        <DialogTitle className="sr-only">Create Dataroom</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new dataroom
        </DialogDescription>

        {/* Templates feature disabled - removed Tabs UI */}
        <Card className="relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <CardHeader className="space-y-3">
            <CardTitle>Create dataroom</CardTitle>
            <CardDescription>
              Start creating a dataroom with a name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col space-y-4"
            >
              <div className="space-y-1">
                <Label htmlFor="dataroom-name-create">
                  Dataroom Name{" "}
                  <span className="text-black dark:text-white">*</span>
                </Label>
                <Input
                  id="dataroom-name-create"
                  placeholder="ACME Acquisition"
                  value={dataroomName}
                  onChange={(e) => setDataroomName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Add new dataroom
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
