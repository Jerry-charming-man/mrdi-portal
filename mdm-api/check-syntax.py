import re

with open('C:/M0056/20-AI/40-Minimax/Portal/mdm-api/test-auth-e2e.cjs', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

print(f'Total lines: {len(lines)}')

# Track cumulative balance
bal_p = bal_b = 0
for i, line in enumerate(lines):
    delta_p = delta_b = 0
    for c in line:
        if c == '(': delta_p += 1
        elif c == ')': delta_p -= 1
        elif c == '{': delta_b += 1
        elif c == '}': delta_b -= 1
    bal_p += delta_p
    bal_b += delta_b
    if delta_p != 0 or delta_b != 0:
        print(f'Line {i+1:3d}: bal_p={bal_p:2d} bal_b={bal_b:2d} | {repr(line[:80])}')

print(f'Final: bal_p={bal_p}, bal_b={bal_b}')
