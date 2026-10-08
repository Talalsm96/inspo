/**
 * The skill's fallback client - `GET /skill/scripts/inspo.sh`. Served
 * as plain text so a browser shows it instead of downloading it: it is
 * meant to be read before it is run.
 */

import { readSkillFile } from "@/lib/skill";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await readSkillFile("scripts/inspo.sh"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="inspo.sh"',
    },
  });
}
