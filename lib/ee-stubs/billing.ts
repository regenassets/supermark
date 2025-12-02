// Billing stubs - all billing features removed
export const CANCELLATION_REASONS = [];
export const PAUSE_DURATIONS = [];
export const CancellationModal = (_props: any) => null;
export const PauseSubscriptionModal = (_props: any) => null;
export const FeedbackModal = (_props: any) => null;
export const RetentionOfferModal = (_props: any) => null;
export const ConfirmCancellationModal = (_props: any) => null;
export const handleCancellation = async () => ({
  success: false,
  message: "Billing disabled",
});
export const handlePause = async () => ({
  success: false,
  message: "Billing disabled",
});
export const handleUnpause = async () => ({
  success: false,
  message: "Billing disabled",
});
export const handleReactivate = async () => ({
  success: false,
  message: "Billing disabled",
});
export const sendPauseResumeNotification = async () => null;
export const automaticUnpause = async () => null;
export const sendPauseResumeNotificationTask = async (..._args: any[]) => null;
export const handleRoute = async (..._args: any[]) =>
  new Response("Billing disabled", { status: 501 });
export default handleRoute;
