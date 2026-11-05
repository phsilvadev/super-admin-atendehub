import { createFileRoute } from "@tanstack/react-router";
import {
  Bookmark, BookOpen, GraduationCap, Users, BadgeCheck, Search, LayoutGrid,
  MessageCircle, BarChart3, CreditCard, Book, Star, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skillzone — Design System" },
      { name: "description", content: "Cores, tipografia e componentes do design system Skillzone." },
      { property: "og:title", content: "Skillzone — Design System" },
      { property: "og:description", content: "Cores, tipografia e componentes do design system Skillzone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const swatches = [
  ["Background", "bg-background border"], ["Card", "bg-card border"], ["Primary", "bg-primary"],
  ["Muted", "bg-muted"], ["Accent", "bg-accent"], ["Brand", "bg-brand"],
  ["Green", "bg-tag-green"], ["Yellow", "bg-tag-yellow"], ["Pink", "bg-tag-pink"], ["Blue", "bg-tag-blue"],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className="flex items-center text-sm text-brand">View all <ChevronRight className="size-4" /></span>
      </div>
      {children}
    </section>
  );
}

function TeacherCard({ dark, name, initials }: { dark?: boolean; name: string; initials: string }) {
  return (
    <div className={cn("rounded-2xl border p-4 space-y-4", dark ? "bg-inverse text-inverse-foreground border-inverse-border shadow-float" : "bg-card shadow-card")}>
      <div className="flex gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-accent font-semibold text-accent-foreground">{initials}</div>
        <div className="flex-1 space-y-1">
          <div className="flex gap-1"><Badge variant="green">TOP Tutor</Badge><Badge variant="yellow"><Star className="size-3" />4.9</Badge></div>
          <p className="flex items-center gap-1 text-sm font-semibold">{name} <BadgeCheck className="size-4 text-brand" /></p>
          <p className={cn("text-xs", dark ? "text-inverse-muted" : "text-muted-foreground")}>Economics teacher</p>
        </div>
        <span className={cn("grid size-7 place-items-center rounded-full", dark ? "bg-card text-brand" : "border text-muted-foreground")}><Bookmark className="size-3.5" /></span>
      </div>
      <p className={cn("text-sm leading-relaxed", dark ? "text-inverse-muted" : "text-muted-foreground")}>Ready to unravel the complexities of supply, demand, and market forces?</p>
      <div className={cn("space-y-2 text-sm", dark ? "text-inverse-muted" : "text-muted-foreground")}>
        <p className="flex items-center gap-2"><GraduationCap className="size-4" />132 lessons conducted</p>
        <p className="flex gap-4"><span className="flex items-center gap-2"><BookOpen className="size-4" />24 courses</span><span className="flex items-center gap-2"><Users className="size-4" />250+ students</span></p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold">$32<span className={cn("text-xs font-normal", dark ? "text-inverse-muted" : "text-muted-foreground")}>/hr</span></p>
        <Button variant={dark ? "inverse" : "outline"}>View More</Button>
      </div>
    </div>
  );
}

function Index() {
  const nav = [[LayoutGrid, "Dashboard"], [Book, "Courses"], [Users, "Teachers"], [MessageCircle, "Messages"], [BarChart3, "Analytics"], [CreditCard, "Payments"]] as const;
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Design System</h1>
        <p className="text-sm text-muted-foreground">Cores, tipografia e componentes recriados a partir da referência.</p>
      </header>

      <Section title="Cores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map(([n, c]) => (
            <div key={n} className="space-y-2"><div className={cn("h-16 rounded-xl", c)} /><p className="text-xs text-muted-foreground">{n}</p></div>
          ))}
        </div>
      </Section>

      <Section title="Tipografia">
        <div className="space-y-2 rounded-2xl border bg-card p-6">
          <p className="text-3xl font-semibold">Teachers</p>
          <p className="text-lg font-medium">Economics teachers</p>
          <p className="text-sm font-semibold">Carole Towne</p>
          <p className="text-sm text-muted-foreground">Search for specific subjects and find the teachers.</p>
        </div>
      </Section>

      <Section title="Componentes">
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button><Button variant="outline">View More</Button><Button variant="brand">Activate teacher account</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="green">TOP Tutor</Badge><Badge variant="pink">Certified</Badge><Badge variant="blue">New Tutor</Badge>
            <Badge variant="yellow"><Star className="size-3" />4.9</Badge><Badge variant="dark">IELTS</Badge><Badge variant="count">8</Badge>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground"><Search className="size-4" />Search teachers</div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 md:grid-cols-2">
          <TeacherCard dark name="Carole Towne" initials="CT" />
          <TeacherCard name="Jenny Wilson" initials="JW" />
        </div>
      </Section>

      <Section title="Sidebar">
        <nav className="max-w-xs space-y-1 rounded-2xl bg-sidebar p-3 text-sidebar-foreground">
          {nav.map(([Icon, label], i) => (
            <div key={label} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", i === 0 && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Icon className="size-4" />{label}{label === "Messages" && <Badge variant="count" className="ml-auto">8</Badge>}
            </div>
          ))}
        </nav>
      </Section>
    </main>
  );
}
