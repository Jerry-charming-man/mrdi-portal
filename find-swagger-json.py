"""Find swagger JSON URL"""
import urllib.request, re

urls_to_try = [
    ('mdm-api', 'http://localhost:3000/openapi.json'),
    ('mdm-api', 'http://localhost:3000/swagger.json'),
    ('mdm-api', 'http://localhost:3000/v1/openapi.json'),
    ('cimrms-api', 'http://localhost:3001/openapi.json'),
    ('cimrms-api', 'http://localhost:3001/swagger.json'),
    ('cimrms-api', 'http://localhost:3001/v1/openapi.json'),
    ('cimims-api', 'http://localhost:3002/openapi.json'),
    ('cimims-api', 'http://localhost:3002/swagger.json'),
    ('cimims-api', 'http://localhost:3002/v1/openapi.json'),
    ('cim-perm-api', 'http://localhost:3003/openapi.json'),
    ('cim-perm-api', 'http://localhost:3003/swagger.json'),
    ('cim-perm-api', 'http://localhost:3003/perm-api/v1/openapi.json'),
]
for name, url in urls_to_try:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as r:
            data = r.read(200).decode()
            print(f'OK {name}: {url}')
    except Exception as e:
        print(f'FAIL {name}: {url}')
