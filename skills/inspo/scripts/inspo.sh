#!/usr/bin/env bash
# Call one Inspo MCP tool on the hosted endpoint without an MCP client.
#
#   bash inspo.sh <tool> ['<json arguments>']
#   bash inspo.sh recommend '{"brief":"calm banking landing page"}'
#   bash inspo.sh get_screen '{"slug":"linear-app"}'
#   bash inspo.sh tools          # list the available tools
#
# The endpoint is free, read-only and needs no auth. It is stateless
# Streamable HTTP with JSON responses, so one POST is one tool call.
# Responses are text-only (images=none) and capped by INSPO_MAX_TOKENS
# (default 6000). INSPO_ENDPOINT points the script at a self-hosted copy.
set -euo pipefail

tool="${1:-}"
args="${2:-}"
[ -n "$args" ] || args='{}'
endpoint="${INSPO_ENDPOINT:-https://inspomcp.dev/api/mcp}"
max_tokens="${INSPO_MAX_TOKENS:-6000}"

if [ -z "$tool" ] || [ "$tool" = "-h" ] || [ "$tool" = "--help" ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

if [ "$tool" = "tools" ]; then
  body='{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
else
  body="{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"${tool}\",\"arguments\":${args}}}"
fi

response="$(curl -fsS --max-time 60 -X POST \
  "${endpoint}?images=none&maxTokens=${max_tokens}" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data "$body")"

# Unwrap the JSON-RPC envelope when a JSON tool is available; otherwise
# print it raw, which is still readable.
if command -v node >/dev/null 2>&1; then
  printf '%s' "$response" | node -e '
    let s = ""; process.stdin.on("data", (c) => (s += c)).on("end", () => {
      const r = JSON.parse(s);
      if (r.error) { console.error(JSON.stringify(r.error, null, 2)); process.exit(1); }
      if (r.result && r.result.tools) {
        for (const t of r.result.tools) console.log(`${t.name}: ${(t.description || "").split("\n")[0]}`);
        return;
      }
      for (const c of (r.result && r.result.content) || []) if (c.type === "text") console.log(c.text);
      if (r.result && r.result.isError) process.exit(1);
    });'
elif command -v jq >/dev/null 2>&1; then
  printf '%s' "$response" | jq -r '.error // (.result.tools // empty | .[] | "\(.name): \(.description | split("\n")[0])") // (.result.content[]? | select(.type == "text") | .text)'
else
  printf '%s\n' "$response"
fi
