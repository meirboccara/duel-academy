#!/bin/bash
# Ask YGOProJudge (the owner's rules site) through its partner chat API, as a discussion.
#
#   scripts/ygoprojudge-chat.sh open <conversationId>             -> prints the chat's sessionId
#   scripts/ygoprojudge-chat.sh ask <sessionId> <file> [cards]    -> sends the question in <file>, prints the answer and its sources
#   scripts/ygoprojudge-chat.sh close <sessionId>
#
# One topic per chat, in general terms (no person or project names). Follow up or contest in the same chat at most 2-3 times,
# then close it (CLAUDE.md, "TCG rules questions"). The key is read from the YGOJ_PARTNER_KEY environment variable, or else from
# ~/.config/ygoprojudge/key; it is never printed and never stored in this repo. Needs bash, curl and python.
set -u
KEY="${YGOJ_PARTNER_KEY:-}"
if [ -z "$KEY" ] && [ -r "$HOME/.config/ygoprojudge/key" ]; then KEY=$(tr -d '\r\n' < "$HOME/.config/ygoprojudge/key"); fi
[ -z "$KEY" ] && { echo "no YGOProJudge key: set YGOJ_PARTNER_KEY or create ~/.config/ygoprojudge/key (ask the owner)"; exit 1; }
BASE=https://ygoprojudge.com/api/partner/v1
HEADERS=(-H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -H "X-Agent-Id: rules-core/1")

case "${1:-}" in
  open)
    [ -z "${2:-}" ] && { echo "usage: $0 open <conversationId>"; exit 1; }
    body=$(python -c 'import json,sys; print(json.dumps({"conversationId": sys.argv[1]}))' "$2")
    curl -s -m 60 "${HEADERS[@]}" -X POST "$BASE/chat-sessions" -d "$body" \
      | python -c 'import json,sys; d=json.load(sys.stdin); print(d.get("sessionId") or ("open failed: " + str(d.get("error"))))' ;;
  ask)
    [ -z "${2:-}" ] || [ -z "${3:-}" ] && { echo "usage: $0 ask <sessionId> <file> [cards]"; exit 1; }
    body=$(python -c 'import json,sys
d = {"text": open(sys.argv[1], encoding="utf8").read().strip()}
if len(sys.argv) > 2 and sys.argv[2]: d["cards"] = sys.argv[2]
print(json.dumps(d))' "$3" "${4:-}")
    curl -s -m 590 "${HEADERS[@]}" -X POST "$BASE/chat-sessions/$2/messages" -d "$body" | python -c 'import json,sys
raw = sys.stdin.read()
try:
    d = json.loads(raw)
    a = d.get("agent") or {}
    if not a and "error" in d:
        print("ERROR:", d); sys.exit()
    print("KIND:", a.get("kind"))
    print(a.get("text", ""))
    for s in (a.get("answer") or {}).get("sources", []):
        print("SOURCE:", s.get("ref"), s.get("title"), s.get("url"))
except Exception:
    print("RAW:", raw[:2000])' ;;
  close)
    [ -z "${2:-}" ] && { echo "usage: $0 close <sessionId>"; exit 1; }
    curl -s -m 60 "${HEADERS[@]}" -X POST "$BASE/chat-sessions/$2/close" > /dev/null && echo closed ;;
  *)
    echo "usage: $0 open <conversationId> | ask <sessionId> <file> [cards] | close <sessionId>"; exit 1 ;;
esac
