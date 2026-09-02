import { ResetPasswordConfirmForm } from "@/components/reset-password-confirm-form";

/**
 * Password-reset confirmation page (Server Component).
 *
 * Reads `uid` and `token` from the URL and hands them to the client form,
 * which binds to `confirmPasswordResetAction`.
 */
export default async function ResetPasswordConfirmPage({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;
  return <ResetPasswordConfirmForm uid={uid} token={token} />;
}
