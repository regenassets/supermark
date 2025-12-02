// Conversations stubs - feature removed
export const ConversationViewSidebar = (_props: any) => null;
export const ConversationListItem = (_props: any) => null;
export const ConversationMessage = (_props: any) => null;
export const ConversationDocumentContext = ({ children }: any) => children;
export const ConversationsNotEnabledBanner = (_props: any) => null;
export const FAQSection = (_props: any) => null;
export const EditFaqModal = (_props: any) => null;
export const PublishFaqModal = (_props: any) => null;
export const LinkOptionConversationSection = (_props: any) => null;
export const ConversationDetail = (_props: any) => null;
export const ConversationOverview = (_props: any) => null;
export const FaqOverview = (_props: any) => null;

// Default export for conversation-section.tsx
export default LinkOptionConversationSection;
export const conversationsRoute = async (...args: any[]) =>
  new Response(JSON.stringify({ error: "Feature disabled" }), { status: 501 });
export const teamConversationsRoute = async (...args: any[]) =>
  new Response(JSON.stringify({ error: "Feature disabled" }), { status: 501 });
export const teamFaqsRoute = async (...args: any[]) =>
  new Response(JSON.stringify({ error: "Feature disabled" }), { status: 501 });
export const publishFAQRoute = teamFaqsRoute; // Alias for FAQ publishing
export const toggleConversationsRoute = async (...args: any[]) =>
  new Response(JSON.stringify({ error: "Feature disabled" }), { status: 501 });
export const sendConversationNotification = async (...args: any[]) => null;
export const sendConversationTeamNotification = async (...args: any[]) => null;
export const conversationMessageNotification = async (...args: any[]) => null;
export const sendConversationMessageNotificationTask = async (...args: any[]) => null;
export const sendConversationTeamMemberNotificationTask = async (...args: any[]) => null;
export const handleRoute = async (...args: any[]) => new Response(JSON.stringify({ error: "Feature disabled" }), { status: 501 });
export const faqSchema = {};

// Type exports
export type ConversationSidebarProps = {
  dataroomId?: string;
  viewId?: string;
  viewerId?: string;
  linkId?: string;
  isEnabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: any;
  documentId?: string;
  pageNumber?: number;
};
