import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="material-symbols-outlined text-secondary/60 text-xl">shield_person</span>
          <div className="h-px flex-1 bg-gradient-to-r from-secondary/20 to-transparent" />
        </div>
        <h2 className="font-headline text-2xl text-on-background">
          Welcome Back
        </h2>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Sign in to continue your journey
        </p>
      </div>

      <LoginForm />

      <p className="text-center font-body text-sm text-on-surface-variant animate-fade-in-up">
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
