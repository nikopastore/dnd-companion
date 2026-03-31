import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-2xl text-on-background">
          Welcome Back
        </h2>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Sign in to continue your journey
        </p>
      </div>

      <LoginForm />

      <p className="text-center font-body text-sm text-on-surface-variant">
        New to the realm?{" "}
        <Link
          href="/register"
          className="text-secondary hover:underline font-medium"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
