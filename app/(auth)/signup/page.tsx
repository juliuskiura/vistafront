import { SignupForm } from "@/components/signup-form";

/**
 * Signup page (Server Component).
 *
 * Renders the client signup form. The form binds to `signupAction` via
 * `useActionState` and works without JavaScript too.
 */
export default function SignupPage() {
  return <SignupForm />;
}
