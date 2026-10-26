"""원고의 [@키] 인용을 첫 인용 순서의 번호로 바꾸고, 참고문헌을 그 순서로 정렬한다.

사용: python3 cite_numbers.py 원본.md 출력.md
원본에서 참고문헌 항목은 "[@키] 서지" 한 줄씩, "## 참고문헌" 아래에 둔다.
"""
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()
cut = s.index("## 참고문헌")
body, refs = s[:cut], s[cut:]
entries = dict(re.findall(r"^\[@(\w+)\] (.+)$", refs, re.M))
order = []
for k in re.findall(r"\[@(\w+)\]", body):
    if k not in order:
        order.append(k)
missing = [k for k in order if k not in entries]
uncited = [k for k in entries if k not in order]
if missing or uncited:
    sys.exit(f"missing: {missing}, uncited: {uncited}")
num = {k: i + 1 for i, k in enumerate(order)}
body = re.sub(r"\[@(\w+)\]", lambda m: f"[{num[m.group(1)]}]", body)
out = body + "## 참고문헌\n\n" + "\n\n".join(f"[{num[k]}] {entries[k]}" for k in order) + "\n"
open(dst, "w", encoding="utf-8").write(out)
print(len(order), "references")
