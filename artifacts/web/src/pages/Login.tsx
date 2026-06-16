import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

// Placeholder web login. Real auth wires to the shared backend in Phase 3.2.
// The mobile login/auth flow is NOT touched by this.
export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-[360px] rounded-xl border border-[var(--keas-border)] bg-[var(--keas-surface)] p-6">
        <div className="mb-5 flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ background: "var(--keas-primary)" }}
          >
            <ShieldAlert size={20} color="#fff" />
          </span>
          <div>
            <div className="text-base font-medium">KEAS Command Center</div>
            <div className="text-xs text-[var(--keas-text-secondary)]">Sign in to continue</div>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/dashboard");
          }}
          className="space-y-3"
        >
          <input
            className="w-full rounded-md border border-[var(--keas-border)] px-3 py-2 text-sm outline-none focus:border-[var(--keas-primary)]"
            placeholder="Badge or email"
            aria-label="Badge or email"
          />
          <input
            type="password"
            className="w-full rounded-md border border-[var(--keas-border)] px-3 py-2 text-sm outline-none focus:border-[var(--keas-primary)]"
            placeholder="Password"
            aria-label="Password"
          />
          <button
            type="submit"
            className="w-full rounded-md py-2 text-sm font-medium text-white"
            style={{ background: "var(--keas-primary)" }}
          >
            Sign in
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-[var(--keas-text-tertiary)]">
          Auth connects to the shared backend in Phase 3.2.
        </p>
      </div>
    </div>
  );
}
