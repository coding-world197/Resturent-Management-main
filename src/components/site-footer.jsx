import { Link } from "@tanstack/react-router";
import { Flame, Instagram, Facebook, Twitter, Clock, MapPin, Phone } from "lucide-react";
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-zinc-950 text-white border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground">
              <Flame className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl">
              FLAME<span className="text-brand">BOX</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Fresh, fast, and flame-grilled since 2015. Serving happiness one bite at a time.
          </p>
          <div className="mt-5 flex gap-3">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/5 border border-white/10 transition hover:bg-brand hover:text-brand-foreground hover:border-brand"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-brand">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link to="/" className="hover:text-brand">
                Home
              </Link>
            </li>
            <li>
              <Link to="/menu" className="hover:text-brand">
                Menu
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-brand">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-brand">
                Admin Portal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-brand">Opening Hours</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Mon–Fri · 11am – 11pm
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Sat–Sun · 10am – 1am
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-brand">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4" /> 221 Grill Street, Foodie Town
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> (555) 123-BITE
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} Flamebox. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
