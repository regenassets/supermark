// Conversations stubs - feature removed
export const ConversationViewSidebar = () => null;
export const ConversationListItem = () => null;
export const ConversationMessage = () => null;
export const ConversationDocumentContext = ({ children }: any) => children;
export const ConversationsNotEnabledBanner = () => null;
export const FAQSection = () => null;
export const EditFaqModal = () => null;
export const PublishFaqModal = () => null;
export const LinkOptionConversationSection = () => null;
export const ConversationDetail = () => null;
export const ConversationOverview = () => null;
export const FaqOverview = () => null;

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
export const faqSchema = {};
