# CashTrack — Student, Parent & Admin Dashboards

A React + Vite + Tailwind implementation of CashTrack's Student, Parent,
and Super Admin experiences, plus a public marketing site and auth flow.

**Target audience: secondary school students** (JSS1–SS3) and their
parents — not university students. Copy, example data, school names, and
default spending limits throughout the app are scaled for that age group
(e.g. weekly limits in the ₦2,000–₦5,000 range rather than university-scale
allowances). See `STUDENT` in `StudentApp.jsx` and `INITIAL_CHILDREN` in
`ParentApp.jsx` for the reference profiles.

- **Student**: Dashboard, Wallet, Transactions, Add Expense, Budget,
  Insights, Notifications, Profile.
- **Parent**: Dashboard, Children, Fund Wallet, Allowance History,
  Spending Limits, Transactions, Insights, Alerts, Parental Controls.
- **Admin**: Dashboard, Users, Wallets, Transactions, Revenue, Reports.

There's a "Switch to Parent View" / "Switch to Student View" link at the
bottom of the sidebar so you can preview the roles without a real login —
this is a stand-in for role-based auth, not the real thing.

**No premium tier.** The product is free to use, full stop. CashTrack's
revenue comes from a small, capped fee (1.5%, capped at ₦200) taken on
each transaction that moves through the platform — see `AdminApp.jsx`
(`FEE_RATE` / `FEE_CAP` / `feeFor()`) and the Revenue page for how this is
computed, and the landing page's "How we make money" section for how it's
presented to users.

**No seeded demo data.** Every account starts empty — no fabricated
transactions, users, or balances. Wallet balances, budgets, and admin
stats are all derived live from whatever the person actually does in the
app (see `INITIAL_*` constants at the top of `StudentApp.jsx`,
`ParentApp.jsx`, and `AdminApp.jsx` — they're empty arrays). Every list
page has a designed empty state guiding the person toward their first
action instead of showing placeholder content.

Data is otherwise in-memory (see the top of `StudentApp.jsx`,
`ParentApp.jsx`, and `AdminApp.jsx`) — there is no backend or database
wired up yet. Actions like adding an expense, funding a child's wallet,
setting a budget limit, or editing spending limits update the in-memory
state live, but nothing persists between page reloads or between the
role views (they don't share state yet).

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To create a production build:

```bash
npm run build
npm run preview
```

## Project structure

```
cashtrack-app/
├── index.html        # Google Fonts (Space Grotesk + Inter)
├── package.json
├── tailwind.config.js # brand/gold/mint palette + fonts
├── postcss.config.js
├── vite.config.js
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx          # landing → auth → role switcher (Student ⇄ Parent ⇄ Admin)
    ├── LandingPage.jsx  # public marketing site (no pricing — see "how we make money")
    ├── AuthPages.jsx    # Login, Sign Up, Reset Password (no real backend)
    ├── StudentApp.jsx   # entire Student dashboard (all pages + empty starter state)
    ├── ParentApp.jsx    # entire Parent dashboard (all pages + empty starter state)
    ├── AdminApp.jsx     # entire Admin dashboard + transaction-fee revenue model
    ├── shared.jsx       # Card, ProgressBar, CategoryIcon, naira(), categories
    └── index.css        # Tailwind directives + font stack
```

## Design system

- **Brand** (`brand-*`): "ink violet" — sidebar, buttons, primary charts.
- **Gold** (`gold-*`): "cowrie gold" — secondary accents, fee-revenue highlights.
- **Mint** (`mint-*`): reserved specifically for positive-money states
  (income, funds received, on-budget) — kept distinct from brand chrome.
- **Fonts**: Space Grotesk for display/headings, Inter for body and figures
  (`.tabular-nums` utility for aligned money figures).

## Next steps

Not yet built: Underage-student restricted view, a real auth backend, and
persistence (wallets, transactions, fee ledger). The Student, Parent, and
Admin wallets are also not actually linked — funding a child from the
Parent view won't currently show up in the Student or Admin views, since
each keeps its own local state.

`StudentApp.jsx`, `ParentApp.jsx`, and `AdminApp.jsx` are each a single
file for now since this started as a prototype — as the app grows it's
worth splitting each page (`DashboardPage`, `WalletPage`, etc.) out into
its own file under `src/pages/student/`, `src/pages/parent/`, and
`src/pages/admin/`.

