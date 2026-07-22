"""Check swagger JSON endpoints"""
import urllib.request, json

urls = [
    ('mdm', 'http://localhost:3000/'),
    ('mdm-json', 'http://localhost:3000/json'),
    ('cimrms', 'http://localhost:3001/'),
    ('cimrms-json', 'http://localhost:3001/json'),
    ('cimims', 'http://localhost:3002/'),
    ('cimims-json', 'http://localhost:3002/json'),
    ('cim-perm', 'http://localhost:3003/'),
    ('cim-perm-json', 'http://localhost:3003/json'),
]
for name, url in urls:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as r:
            body = r.read(500).decode()
            print(f'{name}: {r.status} | {body[:200]}')
    except Exception as e:
        print(f'{name}: FAIL - {e}')
