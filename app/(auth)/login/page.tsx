import { LoginForm } from "@/components/login-form";
import { initialAuthState } from "@/lib/auth/action-state";

/**
 * Login page (Server Component).
 *
 * Renders the client `<LoginForm />` with the initial Server Action state.
 * The form binds directly to `loginAction` so it works without JavaScript;
 * with JavaScript, `useActionState` shows pending state and inline errors.
 */
export default function LoginPage() {
  return <LoginForm action={initialAuthState} />;
}
