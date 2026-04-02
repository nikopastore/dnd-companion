import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="material-symbols-outlined text-secondary/60 text-xl">auto_stories</span>
          <div className="h-px flex-1 bg-gradient-to-r from-secondary/20 to-transparent" />
        </div>
        <h2 className="font-headline text-2xl text-on-background">
          Begin Your Legend
        </h2>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Create an account to forge your destiny
        </p>
      </div>

      <RegisterForm />

      <p className="text-center font-body text-sm text-on-surface-variant animate-fade-in-up">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-secondary hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
