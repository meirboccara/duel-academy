#!/bin/bash
# Ask YGOProJudge (the owner's rules site) through its partner chat API, as a discussion.
#
#   scripts/ygoprojudge-chat.sh open <conversationId>             -> prints the chat's sessionId
#   scripts/ygoprojudge-chat.sh ask <sessionId> <file> [cards]    -> sends the question in <file>, prints the answer and its sources
#   scripts/ygoprojudge-chat.sh answer <sessionId>                -> prints the latest answer of the chat; sends nothing
#   scripts/ygoprojudge-chat.sh close <sessionId>
#
# Every message costs money: a question is never sent twice. `ask` first reads the chat; if the same question is already in it,
# it sends nothing and prints the answer given (or says it is still pending: read it later with `answer`). An answer can take
# several minutes: run `ask` with a 10-minute timeout or in the background; if a call was cut off, use `answer`, never `ask` again.
# One topic per chat, in general terms (no person or project names). Follow up or contest in the same chat at most 2-3 times,
# then close it (CLAUDE.md, "TCG rules questions"). The key is read from the YGOJ_PARTNER_KEY environment variable, or else from
# ~/.config/ygoprojudge/key; it is never printed and never stored in this repo. Needs bash, curl and python.
set -u
KEY="${YGOJ_PARTNER_KEY:-}"
if [ -z "$KEY" ] && [ -r "$HOME/.config/ygoprojudge/key" ]; then KEY=$(tr -d '\r\n' < "$HOME/.config/ygoprojudge/key"); fi
[ -z "$KEY" ] && { echo "no YGOProJudge key: set YGOJ_PARTNER_KEY or create ~/.config/ygoprojudge/key (ask the owner)"; exit 1; }
BASE=https://ygoprojudge.com/api/partner/v1
HEADERS=(-H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -H "X-Agent-Id: rules-core/1")

# Prints one agent turn (an answer or an error) read from JSON on stdin: either a message response ({agent: ...}) or a chat
# view ({turns: [...]}), in which case, with an optional question as $1, the answer that follows that question (default: the last
# question). Exit code 3 when the question has no answer yet, 4 when the chat does not hold that question.
SHOW='import json, sys
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception:
    print("RAW:", raw[:2000]); sys.exit(1)
if "error" in d and "agent" not in d and "turns" not in d:
    print("ERROR:", d); sys.exit(1)
agent = d.get("agent")
if agent is None:
    turns = d.get("turns") or []
    question = sys.argv[1].strip() if len(sys.argv) > 1 and sys.argv[1] else None
    asked = [i for i, t in enumerate(turns) if t.get("author") == "user" and (question is None or (t.get("text") or "").strip() == question)]
    if not asked:
        print("NOT ASKED: this chat does not hold that question."); sys.exit(4)
    after = [t for t in turns[asked[-1] + 1:] if t.get("author") == "agent"]
    if not after:
        print("PENDING: the question was sent and has no answer yet; read it later with `answer <sessionId>`, do not ask again."); sys.exit(3)
    agent = after[0]
print("KIND:", agent.get("kind"))
print(agent.get("text", ""))
for s in (agent.get("answer") or {}).get("sources", []):
    print("SOURCE:", s.get("ref"), s.get("title"), s.get("url"))'

view() { curl -s -m 60 "${HEADERS[@]}" "$BASE/chat-sessions/$1"; }

case "${1:-}" in
  open)
    [ -z "${2:-}" ] && { echo "usage: $0 open <conversationId>"; exit 1; }
    body=$(python -c 'import json,sys; print(json.dumps({"conversationId": sys.argv[1]}))' "$2")
    curl -s -m 60 "${HEADERS[@]}" -X POST "$BASE/chat-sessions" -d "$body" \
      | python -c 'import json,sys; d=json.load(sys.stdin); print(d.get("sessionId") or ("open failed: " + str(d.get("error"))))' ;;
  ask)
    [ -z "${2:-}" ] || [ -z "${3:-}" ] && { echo "usage: $0 ask <sessionId> <file> [cards]"; exit 1; }
    question=$(python -c 'import sys; print(open(sys.argv[1], encoding="utf8").read().strip())' "$3")
    # Never send the same question twice: if the chat already holds it, show what it got instead.
    existing=$(view "$2" | python -c "$SHOW" "$question"); code=$?
    if [ $code -ne 4 ]; then echo "ALREADY ASKED in this chat: nothing sent."; echo "$existing"; exit 0; fi
    body=$(python -c 'import json,sys
d = {"text": open(sys.argv[1], encoding="utf8").read().strip()}
if len(sys.argv) > 2 and sys.argv[2]: d["cards"] = sys.argv[2]
print(json.dumps(d))' "$3" "${4:-}")
    curl -s -m 590 "${HEADERS[@]}" -X POST "$BASE/chat-sessions/$2/messages" -d "$body" | python -c "$SHOW" ;;
  answer)
    [ -z "${2:-}" ] && { echo "usage: $0 answer <sessionId>"; exit 1; }
    view "$2" | python -c "$SHOW" ;;
  close)
    [ -z "${2:-}" ] && { echo "usage: $0 close <sessionId>"; exit 1; }
    curl -s -m 60 "${HEADERS[@]}" -X POST "$BASE/chat-sessions/$2/close" > /dev/null && echo closed ;;
  *)
    echo "usage: $0 open <conversationId> | ask <sessionId> <file> [cards] | answer <sessionId> | close <sessionId>"; exit 1 ;;
esac
