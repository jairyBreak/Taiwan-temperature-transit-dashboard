import json

with open("/Users/jimshih/.gemini/antigravity-cli/brain/0d9cc176-ed95-438f-9cfc-4f7cbe45889f/.system_generated/logs/transcript_full.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        obj = json.loads(line)
        idx = obj.get("step_index")
        if 370 <= idx <= 450:
            type_ = obj.get("type")
            source = obj.get("source")
            content = obj.get("content", "")
            if type_ == "USER_INPUT":
                print(f"\n[Step {idx}] USER: {content[:300]}")
            elif type_ == "PLANNER_RESPONSE" or source == "MODEL":
                print(f"[Step {idx}] MODEL: {content[:400]}")
                if "tool_calls" in obj:
                    for tc in obj["tool_calls"]:
                        print(f"   Tool Call: {tc['name']} with args {str(tc['args'])[:150]}")
