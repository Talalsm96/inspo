import Link from "next/link";
import type { Metadata } from "next";
import { InstallTabs, type InstallTab } from "@/components/install-tabs";
import { site } from "@/lib/site";
import {
  AGENT_INSTALL_PROMPT,
  SKILL_DIRS,
  SKILL_NAME,
  curlInstall,
  readSkillFile,
  skillUrl,
} from "@/lib/skill";

export const metadata: Metadata = {
  title: "Skill",
  description:
    "The Inspo Agent Skill for Claude Code, Codex, Cursor and more: your agent studies real production sites before it writes UI. Free, no account, one prompt to install.",
};

// Everything here is read from the repo at build time.
export const dynamic = "force-static";

/**
 * Install paths, loosest to tightest - the same order as /mcp. The
 * prompt is first because the agent knows which folder it reads skills
 * from better than the person pasting does.
 */
const installTabs: InstallTab[] = [
  {
    id: "agent",
    label: "Ask your agent",
    note: "Paste into Claude Code, Codex, Cursor or any agent - it picks its own skills folder.",
    variant: "prose",
    snippet: AGENT_INSTALL_PROMPT,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    note: `${SKILL_DIRS.claude} - every project. Use .claude/skills/${SKILL_NAME} for one repo.`,
    variant: "code",
    snippet: curlInstall(SKILL_DIRS.claude),
  },
  {
    id: "other",
    label: "Codex, Cursor + others",
    note: `${SKILL_DIRS.agents} - the shared folder most agents read.`,
    variant: "code",
    snippet: curlInstall(SKILL_DIRS.agents),
  },
  {
    id: "skills-cli",
    label: "skills CLI",
    note: "Installs straight from the GitHub repo and asks which agents to wire.",
    snippet: `npx skills add ${site.github.owner}/${site.github.repo} --skill ${SKILL_NAME}`,
  },
];

const steps: { title: string; body: string }[] = [
  {
    title: "Reach the archive",
    body: "Uses the Inspo MCP tools when they are connected; otherwise a bundled script calls the same tools on the free hosted endpoint. Nothing to configure.",
  },
  {
    title: "Write the brief",
    body: "One sentence: product, audience, register. Brand colours kept as hex for a palette search.",
  },
  {
    title: "Study, on a budget",
    body: "recommend first, a search or two, then the full record and DESIGN.md of the three to five references it keeps. About five calls.",
  },
  {
    title: "Decide before markup",
    body: "Names the macrostructure, says what it takes from each reference, and fixes palette roles, type ramp and one section rhythm.",
  },
  {
    title: "Build to the fold",
    body: "Hero complete in the first viewport, 80-160px between sections, copy in a padded column - rules measured from the archive.",
  },
  {
    title: "Verify and credit",
    body: "Checks 1280×800 and 390px, then links you the real sites that shaped the page.",
  },
];

export default async function SkillPage() {
  const skillMd = await readSkillFile("SKILL.md");

  return (
    <div className="mx-auto max-w-[120rem] px-4 sm:px-10">
      {/* Hero ─ pitch straight into the install module, as on /mcp. */}
      <section className="pt-14 pb-16 sm:pt-20">
        <div className="mx-auto max-w-[62rem] text-center">
          <p className="text-meta">Agent Skill · free, no account</p>
          <h1 className="font-display mx-auto mt-5 max-w-[20ch] text-balance text-[length:var(--text-h1)] leading-[0.95] tracking-tight">
            Teach your agent to{" "}
            <em className="not-italic text-[var(--color-link)]">look before it builds.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-[var(--color-fg-muted)]">
            The MCP gives your agent the archive. The skill gives it the
            habit: study real production sites, decide, then write UI that
            reads as shipped - not generated.
          </p>

          <div className="mt-10 text-left">
            <InstallTabs tabs={installTabs} />
          </div>

          <p className="mt-5 text-sm text-[var(--color-fg-muted)]">
            Or read the files first:{" "}
            <a href={skillUrl("SKILL.md")} className="underline-offset-4 hover:text-[var(--color-link)] hover:underline">
              SKILL.md
            </a>
            {" · "}
            <a href={skillUrl("scripts/inspo.sh")} className="underline-offset-4 hover:text-[var(--color-link)] hover:underline">
              scripts/inspo.sh
            </a>
            {" · "}
            <a href={skillUrl("install.md")} className="underline-offset-4 hover:text-[var(--color-link)] hover:underline">
              install.md
            </a>
          </p>
        </div>
      </section>

      {/* What it does ─ the six steps of SKILL.md, in brief. */}
      <section className="border-t rule py-16">
        <div className="mx-auto max-w-[68rem]">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              What your agent does with it.
            </h2>
            <p className="mt-3 text-[var(--color-fg-muted)]">
              It triggers on UI work - a new page, a redesign, a request for
              references - and stays out of the way when your project already
              has a design system.
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2">
                <span className="text-meta">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-xl leading-tight">{s.title}</span>
                <p className="text-sm text-[var(--color-fg-muted)]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Skill vs MCP ─ they compose; say so plainly. */}
      <section className="border-t rule py-16">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="font-display mx-auto max-w-[24ch] text-balance text-3xl leading-tight tracking-tight sm:text-4xl">
            Skill or MCP?{" "}
            <em className="not-italic text-[var(--color-link)]">Both, ideally.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-[var(--color-fg-muted)]">
            The skill works alone: its script reaches the same fifteen tools
            over HTTPS, as text. Connect the MCP server as well and your
            agent also sees the screenshots inline.
          </p>
          <p className="mt-7">
            <Link
              href="/mcp"
              className="inline-flex items-center gap-2 rounded-full border rule px-6 py-3 text-sm transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
            >
              Install the MCP server
              <span aria-hidden>→</span>
            </Link>
          </p>
        </div>
      </section>

      {/* The file itself ─ folded, like the tool reference on /mcp. */}
      <section className="border-t rule pt-16 pb-4">
        <div className="mx-auto max-w-[68rem]">
          <details className="group rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] open:bg-[var(--color-bg)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 sm:px-8 [&::-webkit-details-marker]:hidden">
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-2xl leading-tight">Read SKILL.md</span>
                <span className="text-sm text-[var(--color-fg-muted)]">
                  everything your agent will be told - nothing hidden
                </span>
              </span>
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border rule text-[var(--color-fg-muted)] transition-transform duration-200 group-open:rotate-180"
              >
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="m2 3.5 3 3 3-3" />
                </svg>
              </span>
            </summary>
            <div className="border-t rule px-6 pt-6 pb-8 sm:px-8">
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--color-fg-muted)]">
                <code>{skillMd}</code>
              </pre>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
