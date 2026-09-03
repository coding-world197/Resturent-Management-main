import { createFileRoute } from "@tanstack/react-router";
import { Timer, Leaf, ShieldCheck, Award } from "lucide-react";
import chefImg from "@/assets/chef.jpg";
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Flamebox" },
      {
        name: "description",
        content:
          "The story of Flamebox: fresh ingredients, bold flavors, and a mission to make fast food great again.",
      },
      { property: "og:title", content: "About Flamebox" },
      {
        property: "og:description",
        content: "Our story, our chefs, and our promise: fast doesn't mean compromise.",
      },
    ],
  }),
  component: AboutPage,
});
const features = [
  { icon: Timer, title: "30-Min Delivery", text: "Hot food, delivered on time — every time." },
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    text: "Locally sourced produce, prepped daily in-house.",
  },
  { icon: ShieldCheck, title: "Best Hygiene", text: "Certified kitchens, spotless standards." },
  { icon: Award, title: "Award-Winning", text: "Voted best fast food two years running." },
];
const stats = [
  { n: "10k+", label: "Happy Customers" },
  { n: "50+", label: "Menu Items" },
  { n: "4.9★", label: "Average Rating" },
  { n: "12", label: "Locations" },
];
function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Our Story</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl leading-[1] sm:text-6xl md:text-7xl">
            Fast food, <span className="text-brand">without the compromise.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            We started Flamebox in 2015 with one belief: fast doesn't have to mean cheap, greasy, or
            bland. Every burger is hand-pressed, every bun baked in-house, every fry cut fresh that
            morning.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <img
          src={chefImg}
          alt="Chef Marco, head of the kitchen"
          className="aspect-[4/5] w-full rounded-3xl object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Meet the chef</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Chef Marco Rivera</h2>
          <p className="mt-4 text-muted-foreground">
            After 15 years cooking in Michelin kitchens, Marco founded Flamebox to bring
            restaurant-grade technique to everyday street food. His obsession with seasoning and
            sourcing is why every bite tastes so bold.
          </p>
          <blockquote className="mt-6 rounded-2xl border-l-4 border-brand bg-secondary/60 p-6 font-display text-xl leading-relaxed">
            "Fast food built us up. We just wanted to make it worthy of the love."
          </blockquote>
        </div>
      </section>

      <section className="bg-ink py-20 text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand">Why Flamebox</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Why choose us</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-brand-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl">{title}</h3>
                <p className="mt-1 text-sm text-cream/70">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-5xl text-brand">{s.n}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-cream/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
