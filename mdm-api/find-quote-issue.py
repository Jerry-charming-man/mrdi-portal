# Find unclosed strings/strings that might be causing parser issues
with open('C:/M0056/20-AI/40-Minimax/Portal/mdm-api/test-auth-e2e.cjs', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Track string state
in_sq = False
in_dq = False
in_bt = False
i = 0
char_pos = 0
line_num = 0
line_start = 0

# Find lines with unbalanced strings
for line_num, line in enumerate(lines):
    for char_pos, c in enumerate(line):
        if c == "'" and not in_dq and not in_bt:
            in_sq = not in_sq
        elif c == '"' and not in_sq and not in_bt:
            in_dq = not in_dq
        elif c == '`' and not in_sq and not in_dq:
            in_bt = not in_bt
    if in_sq or in_dq or in_bt:
        print(f'Line {line_num+1}: Unclosed {["sq","dq","bt"][in_sq*0+in_dq*1+in_bt*2]} | {repr(line[:100])}')

if not (in_sq or in_dq or in_bt):
    print('All strings are balanced')
