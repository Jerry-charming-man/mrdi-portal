const BASE = 'http://localhost:3003/perm-api/v1';
const Q_ADMIN  = '?dev_login&email=admin@mrdi.local&role=admin&name=Admin&department=CIM';
const Q_AUDIT = '?dev_login&email=auditor@mrdi.local&role=auditor&name=Auditor&department=CIM';
const Q_VIEWER = '?dev_login&email=viewer@mrdi.local&role=viewer&name=Viewer&department=CIM';
const Q_EDITOR = '?dev_login&email=editor@mrdi.local&role=editor&name=Editor&department=CIM';

async function fetch(path, opts) {
  const res = await globalThis.fetch(path, opts || {});
  const body = await res.text();
  return { status: res.status, body };
}

async function check(label, url, expectStatus) {
  const r = await fetch(url);
  const ok = r.status === expectStatus;
  console.log((ok ? 'PASS' : 'FAIL') + ' [' + r.status + '] ' + label + (ok ? '' : ' => ' + r.body.slice(0, 80)));
}

async function postCheck(label, url, jsonBody, expectStatus) {
  const r = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:jsonBody});
  const ok = r.status === expectStatus;
  console.log((ok ? 'PASS' : 'FAIL') + ' [' + r.status + '] ' + label + (ok ? '' : ' => ' + r.body.slice(0, 80)));
}

async function main() {
  const body = JSON.stringify({target_system:'SAP',permission_type:'system_access',permission_level:'read',resource_id:'FI-003',reason:'Guard test',requested_duration:'30d',urgency:'normal'});

  // Create a request as editor
  const r0 = await fetch(BASE+'/requests'+Q_EDITOR, {method:'POST',headers:{'Content-Type':'application/json'},body:body});
  const req = JSON.parse(r0.body);
  if (!req.id) { console.log('SKIP: create failed', r0.body.slice(0,100)); return; }
  console.log('Request ID:', req.id);

  // it-review (editor+) — POST
  const reviewBody = JSON.stringify({action:'approve',comment:'ok'});
  await postCheck('it-review viewer 403', BASE+'/requests/'+req.id+'/it-review'+Q_VIEWER, reviewBody, 403);
  await postCheck('it-review editor 200', BASE+'/requests/'+req.id+'/it-review'+Q_EDITOR, reviewBody, 200);
  await postCheck('it-review auditor 403', BASE+'/requests/'+req.id+'/it-review'+Q_AUDIT, reviewBody, 403);
  await postCheck('it-review admin 200', BASE+'/requests/'+req.id+'/it-review'+Q_ADMIN, reviewBody, 200);

  // Create another request for owner-review / revoke / extend
  const body2 = JSON.stringify({target_system:'SAP',permission_type:'system_access',permission_level:'write',resource_id:'FI-004',reason:'Owner review test',requested_duration:'30d',urgency:'normal'});
  const r2 = await fetch(BASE+'/requests'+Q_VIEWER, {method:'POST',headers:{'Content-Type':'application/json'},body:body2});
  const req2 = JSON.parse(r2.body);
  if (req2.id) {
    // owner-review (auditor+) — POST
    const body2a = JSON.stringify({action:'approve',comment:'ok'});
    await postCheck('owner-review viewer 403', BASE+'/requests/'+req2.id+'/owner-review'+Q_VIEWER, body2a, 403);
    await postCheck('owner-review editor 403', BASE+'/requests/'+req2.id+'/owner-review'+Q_EDITOR, body2a, 403);
    await postCheck('owner-review auditor 200', BASE+'/requests/'+req2.id+'/owner-review'+Q_AUDIT, body2a, 200);
    await postCheck('owner-review admin 200', BASE+'/requests/'+req2.id+'/owner-review'+Q_ADMIN, body2a, 200);

    // revoke (auditor+) — POST
    const body3 = JSON.stringify({reason:'revoke reason'});
    await postCheck('revoke viewer 403', BASE+'/requests/'+req2.id+'/revoke'+Q_VIEWER, body3, 403);
    await postCheck('revoke editor 403', BASE+'/requests/'+req2.id+'/revoke'+Q_EDITOR, body3, 403);
    await postCheck('revoke auditor 200', BASE+'/requests/'+req2.id+'/revoke'+Q_AUDIT, body3, 200);

    // extend (auditor+) — POST
    const body4 = JSON.stringify({new_duration:'60d'});
    await postCheck('extend viewer 403', BASE+'/requests/'+req2.id+'/extend'+Q_VIEWER, body4, 403);
    await postCheck('extend auditor 200', BASE+'/requests/'+req2.id+'/extend'+Q_AUDIT, body4, 200);
  }

  // comment (viewer+)
  const listR = await fetch(BASE+'/requests'+Q_VIEWER);
  const req3 = JSON.parse(listR.body);
  if (req3.items && req3.items.length > 0) {
    const id3 = req3.items[0].id;
    const body5 = JSON.stringify({comment:'test comment'});
    await postCheck('comment viewer 200', BASE+'/requests/'+id3+'/comment'+Q_VIEWER, body5, 200);
    await check('comment unauth 401', BASE+'/requests/'+id3+'/comment', 401);
    await postCheck('withdraw own viewer 200', BASE+'/requests/'+id3+'/withdraw'+Q_VIEWER, '{}', 200);
  }

  console.log('Done.');
}

main().catch(console.error);
