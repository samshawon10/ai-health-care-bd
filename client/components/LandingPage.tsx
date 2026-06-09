import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MessageCircle,
  PhoneCall,
  Play,
  ShieldAlert,
  Stethoscope
} from "lucide-react";
import { Button, Card, MedicalDisclaimer, RiskBadge, SectionEyebrow, TypingDots } from "./ui-system";

const features = [
  {
    icon: Stethoscope,
    title: "AI Symptom Analysis",
    text: "Structured guidance with possible conditions, risk levels, and next steps."
  },
  {
    icon: ShieldAlert,
    title: "Emergency Detection",
    text: "Deterministic red-flag screening before AI analysis for safer triage."
  },
  {
    icon: FileText,
    title: "Report Explanation",
    text: "Turns medical report values into clear summaries and risk indicators."
  },
  {
    icon: MessageCircle,
    title: "Safe AI Chat",
    text: "Healthcare Q&A designed around conservative, non-diagnostic language."
  }
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "For personal health checks",
    features: ["3 AI checks/day", "Emergency alerts", "Basic history"]
  },
  {
    name: "Pro",
    price: "$12",
    description: "For families and power users",
    features: ["Unlimited checks", "Report analyzer", "Priority AI responses"],
    featured: true
  },
  {
    name: "Clinic",
    price: "Custom",
    description: "For telehealth and hospitals",
    features: ["Team dashboard", "Audit-ready history", "Clinic workflows"]
  }
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="sticky top-0 z-30 border-b border-blue-100/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight">AI Healthcare</p>
              <p className="text-xs font-bold text-slate-500">Assistant</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 lg:flex">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#demo">Demo</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden rounded-xl px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-blue-50 sm:inline-flex" href="/auth/sign-in">
              Sign in
            </Link>
            <Link className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02]" href="/auth/sign-up">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <SectionEyebrow>Hospital-grade medical AI</SectionEyebrow>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">
              Your AI Healthcare Assistant
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Analyze symptoms, detect emergency health risks, explain medical reports, and get safe guidance in a premium telehealth-ready workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/sign-up">
                <Button icon={ArrowRight}>Start Free Health Check</Button>
              </Link>
              <a href="#demo">
                <Button variant="secondary" icon={Play}>Watch Demo</Button>
              </a>
            </div>
            <div className="mt-6 grid max-w-lg gap-2 text-sm font-bold text-slate-600 sm:grid-cols-3">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Bangla + English</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Emergency-first</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Safe by design</span>
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionEyebrow>AI tools</SectionEyebrow>
          <h2 className="text-3xl font-black tracking-tight">Everything a modern healthcare AI product needs.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-black">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {["Describe symptoms", "AI checks risk", "Get safe next steps"].map((step, index) => (
            <Card key={step}>
              <p className="text-sm font-black text-blue-600">Step {index + 1}</p>
              <h3 className="mt-2 text-xl font-black">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {index === 0
                  ? "Users enter symptoms in Bangla or English."
                  : index === 1
                    ? "Emergency red flags are detected before AI response generation."
                    : "The product returns condition context, risk level, recommendation, and safety disclaimer."}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[24px] border border-rose-200 bg-rose-50 p-6 shadow-xl shadow-rose-100 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-rose-700">Emergency detection highlight</p>
              <h2 className="mt-2 text-3xl font-black text-rose-950">Red-flag symptoms should never wait for a chatbot.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-900">
                Chest pain, severe breathing issues, stroke signs, unconsciousness, and other high-risk patterns trigger immediate action UI.
              </p>
            </div>
            <div className="grid gap-2">
                <Button variant="danger" icon={PhoneCall}>Call emergency</Button>
              <Button variant="secondary" icon={ShieldAlert}>Find nearby hospital</Button>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionEyebrow>Live demo preview</SectionEyebrow>
          <h2 className="text-3xl font-black tracking-tight">A ChatGPT-like flow with clinical guardrails.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Suggested prompts, AI typing states, risk badges, and clear emergency pathways are built into the interface.
          </p>
        </div>
        <Card hover={false}>
          <div className="grid gap-3">
            <div className="max-w-[80%] rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">I have fever and headache.</div>
            <div className="ml-auto max-w-[80%] rounded-2xl bg-blue-600 p-3 text-sm text-white">Can you explain what I should do?</div>
            <div className="max-w-[86%] rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
              <div className="mb-2"><TypingDots /></div>
              Possible viral illness. Monitor temperature, hydrate, and seek care if symptoms worsen.
              <div className="mt-2"><RiskBadge risk="Low" /></div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {["Telehealth founder", "Clinic operations lead", "Patient beta user"].map((name) => (
            <Card key={name}>
              <p className="text-sm leading-6 text-slate-600">“The interface feels trustworthy, fast, and clear enough for real healthcare workflows.”</p>
              <p className="mt-4 text-sm font-black text-slate-950">{name}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h2 className="text-3xl font-black tracking-tight">Start simple. Scale to clinics.</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {pricing.map((plan) => (
            <Card key={plan.name} className={plan.featured ? "ring-2 ring-blue-500" : ""}>
              <h3 className="text-xl font-black">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <p className="mt-5 text-4xl font-black">{plan.price}</p>
              <div className="mt-5 grid gap-2">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    {feature}
                  </p>
                ))}
              </div>
              <Link className="mt-6 inline-flex w-full" href="/auth/sign-up">
                <Button className="w-full" variant={plan.featured ? "primary" : "secondary"}>Choose plan</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white shadow-2xl shadow-blue-500/25">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">Start your first AI health check today.</h2>
              <p className="mt-2 text-blue-50">Built for clarity, emergency visibility, and safe guidance.</p>
            </div>
            <Link href="/auth/sign-up">
              <Button variant="secondary">Open Dashboard</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <p className="text-sm font-black">AI Healthcare Assistant</p>
          <MedicalDisclaimer compact />
        </div>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -left-4 top-8 hidden rounded-2xl border border-white/80 bg-white/80 p-3 shadow-xl backdrop-blur md:block">
        <div className="flex items-center gap-2 text-sm font-black text-rose-700">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Emergency rule active
        </div>
      </div>
      <div className="rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-blue-200/70 backdrop-blur-xl">
        <div className="rounded-[22px] border border-blue-100 bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-black">AI Care Console</p>
                <p className="text-xs text-slate-400">Live triage preview</p>
              </div>
            </div>
            <RiskBadge risk="Low" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Risk", "Score", "Alerts"].map((label, index) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-black">{index === 0 ? "Low" : index === 1 ? "92" : "0"}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 text-slate-950">
            <div className="flex items-center gap-2 text-sm font-black">
              <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
              AI symptom result
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Possible mild viral illness. Continue monitoring and seek care if symptoms worsen.</p>
            <div className="mt-3 h-2 rounded-full bg-blue-50">
              <div className="h-2 w-[74%] rounded-full bg-gradient-to-r from-blue-600 to-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
