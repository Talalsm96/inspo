/**
 * Raw SKILL.md - `GET /skill/SKILL.md`. Read from `skills/inspo/` at
 * build time (see lib/skill.ts), so it is always the repo's copy.
 */

import { readSkillFile } from "@/lib/skill";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await readSkillFile("SKILL.md"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'inline; filename="SKILL.md"',
    },
  });
}
