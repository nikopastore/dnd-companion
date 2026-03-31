import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-2xl text-on-background">
          Begin Your Legend
        </h2>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Create an account to forge your destiny
        </p>
      </div>

      <RegisterForm />

      <p className="text-center font-body text-sm text-on-surface-variant">
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
