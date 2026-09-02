import { ActivationForm } from "@/components/activation-form";

/**
 * Activation page (Server Component).
 *
 * Reads the `uid` and `token` from the URL and hands them to the client
 * `<ActivationForm />`, which auto-submits `activateAndLoginAction` and
 * either redirects the user into the app or shows an error.
 */
export default async function ActivationPage({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;
  return <ActivationForm uid={uid} token={token} />;
}
