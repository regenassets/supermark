// Permissions stubs - AGPL migration: Use regular LinkSheet for dataroom links
import LinkSheet from "@/components/links/link-sheet";

export type ItemPermission = any; // Simplified for AGPL - all users have full permissions

export const DataroomLinkSheet = (props: any) => {
  // AGPL: All users have full dataroom link permissions
  return <LinkSheet {...props} />;
};

export const PermissionsSheet = ({ children }: any) => children;
