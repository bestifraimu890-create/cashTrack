import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Wallet,
  ShieldCheck,
  Bell,
  PieChart,
  Send,
  Lock,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Users,
  Percent,
  TrendingUp,
  Sparkles,
  BookOpen,
  Backpack,
  Clock,
  MapPin,
  PiggyBank
} from "lucide-react";
import { naira } from "./shared.jsx";

/* ─── scroll-animation hook ─── */
function useScrollAnimation(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

function AnimatedSection({ children, className = "", anim = "fade-up", delay = 0, ...props }) {
  const [ref, isVisible] = useScrollAnimation();

  const delayClass = delay > 0 ? `transition-delay-${delay}` : "";
  const animClass = `anim-${anim}`;
  const appliedClass = isVisible ? `${animClass} anim-visible ${delayClass}` : animClass;

  return (
    <div
      ref={ref}
      className={`${appliedClass} ${className}`}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/* Stock photography real secondary school students, classrooms and
   campus life. Used to ground the product in what school actually
   looks like day to day. */
const PHOTOS = {
  classroomDesks:
    "https://images.unsplash.com/photo-1698993082050-19ca94c62fb8?auto=format&fit=crop&w=1200&q=80",
  uniformWalking:
    "https://images.unsplash.com/photo-1612229693210-30e16029c415?auto=format&fit=crop&w=1200&q=80",
  uniformField:
    "https://images.unsplash.com/photo-1591219233007-4ac041f8c2be?auto=format&fit=crop&w=1200&q=80",
  boyWithFriends:
    "https://images.unsplash.com/photo-1543689604-6fe8dbcd1f59?auto=format&fit=crop&w=1200&q=80",
  boyUniform:
    "https://images.unsplash.com/photo-1617056239820-8ce90ba48193?auto=format&fit=crop&w=1200&q=80",
};

/* ============================================================
   LANDING PAGE
   Marketing site for CashTrack. No pricing tiers  the product
   is free to use; CashTrack earns a small, transparent fee only
   when money actually moves.
   ============================================================ */

const NAIRA_MARK = (
  <span className="font-display text-[1.05em] leading-none">₦</span>
);

function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-lg font-bold ${
          dark ? "bg-white text-brand-800" : "bg-brand-700 text-white"
        }`}
      ><PiggyBank /></div>
      <span
        className={`font-display text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}
      >
        CashTrack
      </span>
    </div>
  );
}

/* --------------------------------- navbar --------------------------------- */

function Navbar({ onGoToLogin, onGoToSignup }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#who-its-for", label: "Who it's for" },
    { href: "#revenue", label: "How we make money" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={onGoToLogin}
            className="text-sm font-semibold text-slate-600 hover:text-brand-700"
          >
            Log In
          </button>
          <button
            onClick={onGoToSignup}
            className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Get Started Free
          </button>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-slate-600 lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-600"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={onGoToLogin}
                className="rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
              >
                Log In
              </button>
              <button
                onClick={onGoToSignup}
                className="rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------- hero ----------------------------------- */

function WalletMock() {
  const rows = [
    { label: "School Tuck Shop", cat: "Food", amt: -800 },
    { label: "Allowance from Mum", cat: "Income", amt: 5000 },
    { label: "School Bus Fare", cat: "Transport", amt: -500 },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-gold-100/40 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <div className="bg-gradient-to-br from-brand-800 to-brand-600 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
            Wallet Balance
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {naira(6500)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-100">
            <ShieldCheck size={13} /> Limits set by parent · On track this week
          </div>
        </div>
        <div className="divide-y divide-slate-100 p-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Wallet size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {r.label}
                </p>
                <p className="text-xs text-slate-400">{r.cat}</p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${r.amt > 0 ? "text-mint-600" : "text-slate-800"}`}
              >
                {r.amt > 0 ? "+" : ""}
                {naira(r.amt)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -right-6 -top-6 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-100 text-gold-700">
            <Bell size={13} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Fund request sent
            </p>
            <p className="text-[11px] text-slate-400">to Mrs. Okafor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onGoToSignup }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <span className="hero-entrance inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
            Built for secondary school life in Nigeria
          </span>
          <h1 className="hero-entrance-delay mt-5 font-display text-4xl font-bold leading-[1.1] text-slate-900 sm:text-5xl">
            Money, sorted
            <br />
            between home and <span className="text-brand-700">school</span>.
          </h1>
          <p className="hero-entrance-delay-2 mt-5 max-w-md text-lg leading-relaxed text-slate-600">
            CashTrack gives secondary school students a real wallet with real
            limits, and gives parents visibility without micromanaging. No
            subscriptions, no locked features just a small fee when money
            actually moves.
          </p>
          <div className="hero-entrance-delay-2 mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onGoToSignup}
              className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              See how it works
            </a>
          </div>
          <div className="hero-entrance-delay-3 mt-10 flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-mint-600" /> Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-mint-600" /> No hidden
              tiers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-mint-600" /> Bank-level
              security
            </span>
          </div>
        </div>
        <div className="wallet-entrance">
          <WalletMock />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- features --------------------------------- */

function Features() {
  const items = [
    {
      icon: Wallet,
      title: "A real wallet, not a spreadsheet",
      body: "Students track balance, budgets and spending in one place funded directly by a parent.",
    },
    {
      icon: ShieldCheck,
      title: "Limits parents actually control",
      body: "Daily, weekly and monthly caps that parents set and adjust any time no guesswork.",
    },
    {
      icon: PieChart,
      title: "Spending that explains itself",
      body: "Every naira is categorized automatically, so budgets and insights build themselves.",
    },
    {
      icon: Send,
      title: "Fund requests, not awkward texts",
      body: "Students request top ups in app; parents approve or decline in one tap.",
    },
    {
      icon: Bell,
      title: "Alerts before things go sideways",
      body: "Budget overages and low balances surface immediately for both sides of the household.",
    },
    {
      icon: Lock,
      title: "Underage-friendly by design",
      body: "Younger students get the same visibility with tighter parental guardrails built in.",
    },
  ];
  return (
    <section
      id="who-its-for"
      className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24"
    >
      <AnimatedSection>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Everything, included
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            One product. No feature you have to pay extra to unlock.
          </h2>
        </div>
      </AnimatedSection>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f, i) => (
          <AnimatedSection key={f.title} anim="pop" delay={i * 80}>
            <div
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <f.icon size={19} />
              </div>
              <p className="mt-4 font-semibold text-slate-900">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {f.body}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- school life --------------------------------- */

function SchoolLife() {
  const facts = [
    {
      icon: Clock,
      title: "Term-time spending",
      body: "Tuck shop, bus fare, printing and lesson fees add up across a single school week  CashTrack keeps every one of them in view.",
    },
    {
      icon: Backpack,
      title: "Day and boarding students",
      body: "Whether a student goes home every evening or stays on campus, funding and limits work the same way for both.",
    },
    {
      icon: BookOpen,
      title: "JSS to SSS",
      body: "From junior secondary right through to WAEC and NECO exam years, the wallet and its controls grow with the student.",
    },
    {
      icon: MapPin,
      title: "Built around Nigerian school life",
      body: "Naira first amounts, familiar categories like transport and tuck shop, and a design that reflects how secondary school actually runs.",
    },
  ];

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <AnimatedSection>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Everyday school life
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Made for secondary school students in modern Nigerian schools.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Secondary school runs on small, constant transactions a bus fare
              here, a snack there, a contribution to a class project, lesson money
              for the weekend. CashTrack was built by watching how students
              actually move money through a school term, so the categories, limits
              and requests match real school life instead of a generic budgeting
              app.
            </p>
          </div>
        </AnimatedSection>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedSection anim="scale-in" className="col-span-1 overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2">
            <img
              src={PHOTOS.classroomDesks}
              alt="Secondary school students in a classroom"
              className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-full"
            />
          </AnimatedSection>
          <AnimatedSection anim="scale-in" delay={100} className="overflow-hidden rounded-2xl">
            <img
              src={PHOTOS.uniformWalking}
              alt="Students in school uniform walking together"
              className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-full"
            />
          </AnimatedSection>
          <AnimatedSection anim="scale-in" delay={200} className="overflow-hidden rounded-2xl">
            <img
              src={PHOTOS.uniformField}
              alt="Students in uniform on the school field"
              className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-full"
            />
          </AnimatedSection>
          <AnimatedSection anim="scale-in" delay={300} className="overflow-hidden rounded-2xl">
            <img
              src={PHOTOS.boyWithFriends}
              alt="Secondary school student with classmates"
              className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-full"
            />
          </AnimatedSection>
          <AnimatedSection anim="scale-in" delay={400} className="overflow-hidden rounded-2xl">
            <img
              src={PHOTOS.boyUniform}
              alt="Secondary school student in uniform"
              className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-full"
            />
          </AnimatedSection>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f, i) => (
            <AnimatedSection key={f.title} anim="fade-up" delay={i * 100}>
              <div className="rounded-2xl border border-slate-200 bg-paper p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <f.icon size={18} />
                </div>
                <p className="mt-4 font-semibold text-slate-900">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {f.body}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- how it works -------------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Parent creates a household",
      body: "Sign up, link one or more children, and set starting limits in minutes.",
    },
    {
      n: "02",
      title: "Student gets a wallet",
      body: "Kids and students log in, see their balance, and start tracking spend right away.",
    },
    {
      n: "03",
      title: "Money moves, visibly",
      body: "Funding, spending and requests all show up for both sides no surprises at month-end.",
    },
  ];
  return (
    <section id="how-it-works" className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <AnimatedSection>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Set up in three steps.
          </h2>
        </AnimatedSection>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <AnimatedSection key={s.n} anim="fade-up" delay={i * 150}>
              <div>
                <span className="font-display text-4xl font-bold text-brand-100">
                  {s.n}
                </span>
                <p className="mt-3 font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {s.body}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- audiences --------------------------------- */

function Audiences() {
  const cards = [
    {
      icon: GraduationCap,
      title: "For Students",
      image: PHOTOS.uniformField,
      body: "See exactly what you have, what you've spent, and what's left  without asking your parent every time. Built for the pace of secondary school, from morning assembly to closing time.",
      points: [
        "Track spending by category",
        "Request funds in one tap",
        "Budgets that build themselves",
      ],
    },
    {
      icon: Users,
      title: "For Parents",
      image: PHOTOS.boyUniform,
      body: "Fund your child's wallet, set the limits that make sense for your family, and stay in the loop without hovering even when your child is away at boarding school.",
      points: [
        "Set daily/weekly/monthly caps",
        "Approve or decline requests instantly",
        "One view across every child",
      ],
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnimatedSection anim="fade-left">
          <div
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card"
          >
            {cards[0].image && (
              <img src={cards[0].image} alt="" className="h-44 w-full object-cover" />
            )}
            <div className="p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
                {React.createElement(cards[0].icon, { size: 20 })}
              </div>
              <p className="mt-5 font-display text-xl font-bold text-slate-900">
                {cards[0].title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {cards[0].body}
              </p>
              <ul className="mt-5 space-y-2.5">
                {cards[0].points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 size={15} className="text-mint-600" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection anim="fade-right">
          <div
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card"
          >
            {cards[1].image && (
              <img src={cards[1].image} alt="" className="h-44 w-full object-cover" />
            )}
            <div className="p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
                {React.createElement(cards[1].icon, { size: 20 })}
              </div>
              <p className="mt-5 font-display text-xl font-bold text-slate-900">
                {cards[1].title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {cards[1].body}
              </p>
              <ul className="mt-5 space-y-2.5">
                {cards[1].points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 size={15} className="text-mint-600" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ------------------------------- revenue / pricing ------------------------------- */

function RevenueSection() {
  return (
    <section id="revenue" className="bg-brand-900 py-16 text-white lg:py-24">
      <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
        <AnimatedSection>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-100">
            <Percent size={13} /> No subscriptions, ever
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl">
            How CashTrack makes money.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            We don't charge a monthly fee and we don't lock features behind a
            paywall. Instead, CashTrack takes a small, capped fee only when a
            transaction actually happens on the platform.
          </p>
        </AnimatedSection>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <AnimatedSection anim="pop" delay={0}>
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="font-display text-3xl font-bold">1.5%</p>
              <p className="mt-1 text-xs text-brand-100">per transaction</p>
            </div>
          </AnimatedSection>
          <AnimatedSection anim="pop" delay={100}>
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="font-display text-3xl font-bold">{naira(200)}</p>
              <p className="mt-1 text-xs text-brand-100">maximum fee, capped</p>
            </div>
          </AnimatedSection>
          <AnimatedSection anim="pop" delay={200}>
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="font-display text-3xl font-bold">{NAIRA_MARK}0</p>
              <p className="mt-1 text-xs text-brand-100">
                to sign up or use the app
              </p>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={300}>
          <p className="mx-auto mt-8 max-w-xl text-sm text-brand-100">
            That means every student and every parent gets the full product
            wallets, budgets, insights, alerts and controls from day one. We only
            make money when we're actually useful to you.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ---------------------------------- cta banner --------------------------------- */

function CtaBanner({ onGoToSignup }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <AnimatedSection anim="scale-in">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-brand-800 to-brand-600 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to sort your money out?
          </h2>
          <p className="max-w-md text-brand-100">
            Join students and parents already using CashTrack to fund, track and
            stay on budget together.
          </p>
          <button
            onClick={onGoToSignup}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Create your free account <ArrowRight size={16} />
          </button>
        </div>
      </AnimatedSection>
    </section>
  );
}

/* ---------------------------------- footer ---------------------------------- */

function Footer({ onGoToLogin, onGoToSignup }) {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <AnimatedSection>
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <Logo />
              <p className="mt-3 text-sm text-slate-500">
                A shared wallet for secondary school students and parents built
                for school life in Nigeria.
              </p>
            </div>
            <div className="flex flex-wrap gap-10">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Product
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                  <a href="#how-it-works" className="hover:text-brand-700">
                    How it works
                  </a>
                  <a href="#who-its-for" className="hover:text-brand-700">
                    Who it's for
                  </a>
                  <a href="#revenue" className="hover:text-brand-700">
                    How we make money
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Account
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                  <button
                    onClick={onGoToLogin}
                    className="text-left hover:text-brand-700"
                  >
                    Log In
                  </button>
                  <button
                    onClick={onGoToSignup}
                    className="text-left hover:text-brand-700"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; 2026 CashTrack. Built for Nigerian students &amp; parents.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={13} /> Bank-level security on every wallet
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------- page ------------------------------------ */

export default function LandingPage({ onGoToLogin, onGoToSignup }) {
  return (
    <div className="w-full bg-paper text-slate-900">
      <Navbar onGoToLogin={onGoToLogin} onGoToSignup={onGoToSignup} />
      <Hero onGoToSignup={onGoToSignup} />
      <Features />
      <SchoolLife />
      <HowItWorks />
      <Audiences />
      <RevenueSection />
      <CtaBanner onGoToSignup={onGoToSignup} />
      <Footer onGoToLogin={onGoToLogin} onGoToSignup={onGoToSignup} />
    </div>
  );
}
