import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import logoUrl from "@/assets/logo-lyna.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClient } from "@/lib/admin-client";
import { isAdminAuthenticated, setAdminAuthenticated } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion administration — Lyna Beauty" },
      { name: "description", content: "Accès sécurisé à l’administration Lyna Beauty." },
      { property: "og:title", content: "Connexion administration — Lyna Beauty" },
      { property: "og:description", content: "Accès sécurisé à l’administration Lyna Beauty." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ]
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminAuthenticated()) void navigate({ to: "/admin/dashboard", replace: true });
  }, [navigate]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await adminClient.rpc("verify_admin_login", { p_username: username.trim(), p_password: password });
    setLoading(false);
    if (result.error || result.data !== true) {
      setError("Identifiants incorrects");
      return;
    }
    setAdminAuthenticated(true);
    await navigate({ to: "/admin/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card-soft w-full max-w-sm rounded-lg p-7">
        <div className="text-center">
          <img src={logoUrl} alt="Lyna Beauty" className="mx-auto size-24 rounded-full object-cover ring-1 ring-gold/50" />
          <h1 className="text-gilded mt-4 font-display text-3xl font-semibold">Lyna Beauty</h1>
          <p className="mt-1 text-sm text-muted-foreground">Espace administration</p>
        </div>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">Nom d'utilisateur</Label>
            <Input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Mot de passe</Label>
            <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><LoaderCircle className="animate-spin" />Connexion…</> : <><LockKeyhole />Se connecter</>}
          </Button>
        </form>
      </section>
    </main>
  );
}