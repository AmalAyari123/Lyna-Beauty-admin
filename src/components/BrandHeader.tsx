import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-lyna.jpg";

export function BrandHeader() {
  return (
    <header className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
      <img
        src={logo}
        alt="Nails & Lashes by Lyna Beauty"
        className="h-28 w-28 rounded-full object-cover ring-1 ring-gold/50 shadow-[0_14px_40px_-22px_var(--rose-deep)]"
      />
      <div>
        <h1 className="text-gilded text-3xl font-semibold sm:text-4xl">Nails &amp; Lashes</h1>
        <p className="mt-1 text-xs tracking-[0.35em] text-muted-foreground uppercase">
          by Lyna Beauty
        </p>
      </div>
      <nav className="flex gap-2 text-sm">
        <Link
          to="/"
          activeProps={{ className: "bg-secondary text-secondary-foreground" }}
          className="rounded-full border border-gold/40 px-4 py-1.5 transition-colors hover:bg-secondary"
        >
          Réserver
        </Link>
        <Link
          to="/rendez-vous"
          activeProps={{ className: "bg-secondary text-secondary-foreground" }}
          className="rounded-full border border-gold/40 px-4 py-1.5 transition-colors hover:bg-secondary"
        >
          Annuler mon rendez-vous
        </Link>
      </nav>
    </header>
  );
}
