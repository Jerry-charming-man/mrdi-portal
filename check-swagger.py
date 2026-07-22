"""Check swagger endpoints for all 4 APIs"""
import urllib.request, json

apis = [
    ('mdm-api', 'http://localhost:3000/'),
    ('cimrms-api', 'http://localhost:3001/'),
    ('cimims-api', 'http://localhost:3002/'),
    ('cim-perm-api', 'http://localhost:3003/'),
]
for name, url in apis:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as r:
            print(f'{name}: {r.status}')
    except Exception as e:
        print(f'{name}: {e}')
