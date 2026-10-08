/**
 * Agent-facing install guide - `GET /skill/install.md`. The target of
 * the "ask your agent" prompt on /skill: the agent fetches this, picks
 * the right skills folder for itself, and downloads the files.
 */

import { renderInstallMd } from "@/lib/skill";

export const dynamic = "force-static";

export function GET() {
  return new Response(renderInstallMd(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
