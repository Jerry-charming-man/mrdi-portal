/**
 * MRDI MDM — Seed Script
 *
 * 灌入 4 个测试用户 + 4 个注册系统 + 4 个 API Key + 3 条示例授权
 * 目的：让 /v1/permissions/check 完整路径（default + grant）都可验证
 *
 * 邮箱域名：@mrdi.org.hk（2026-07-16 更新）
 */
import { PrismaClient, GrantStatus, GrantVia, SystemStatus, UserStatus } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
// 测试账号密码（与 Login.tsx hint 对齐）
const TEST_ACCOUNTS = [
    { email: 'jerry.sun@mrdi.org.hk', name: 'Jerry Sun', department: 'CIM', global_role: 'admin', password: 'Jerry1234!' },
    { email: 'auditor@mrdi.org.hk', name: 'Alice Auditor', department: 'QA', global_role: 'auditor', password: 'Auditor1234!' },
    { email: 'editor@mrdi.org.hk', name: 'Ed Editor', department: 'CIM', global_role: 'editor', password: 'Editor1234!' },
    { email: 'viewer@mrdi.org.hk', name: 'Vince Viewer', department: 'Mfg', global_role: 'viewer', password: 'Viewer1234!' },
];
function hashKey(raw) {
    return createHash('sha256').update(raw).digest('hex');
}
function genApiKey(systemTag) {
    const rand = randomBytes(12).toString('hex');
    const raw = `mrdi_${systemTag}_${rand}`;
    return {
        raw,
        hash: hashKey(raw),
        prefix: `mrdi_${systemTag}_${rand.slice(0, 4)}••••`,
    };
}
async function main() {
    console.log('🌱 MRDI MDM seed starting...\n');
    // ---------- 1. Users ----------
    console.log('👤 Seeding users...');
    for (const u of TEST_ACCOUNTS) {
        const password_hash = await hashPassword(u.password);
        const created = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                department: u.department,
                global_role: u.global_role,
                status: UserStatus.active,
                password_hash,
                failed_login_count: 0,
                locked_until: null,
            },
            create: {
                email: u.email,
                name: u.name,
                department: u.department,
                global_role: u.global_role,
                status: UserStatus.active,
                password_hash,
                failed_login_count: 0,
            },
        });
        console.log(`   ✓ ${created.email.padEnd(28)} [${u.global_role}]  password: ${u.password}`);
    }
    // ---------- 2. Registered Systems ----------
    console.log('\n🏗️  Seeding registered systems...');
    const systems = [
        { system_id: 'mdm-api', name: 'MDM API', description: '主数据 + 权限服务自身', api_base_url: 'http://mdm-api:3000' },
        { system_id: 'cimrms-api', name: 'CIM-RMS API', description: '需求工作流（CIM-RMS）', api_base_url: 'http://cimrms-api:3001' },
        { system_id: 'cim-ims-api', name: 'CIM-IMS API', description: '報案/工單系統', api_base_url: 'http://cim-ims-api:3002' },
        { system_id: 'cim-perm-api', name: 'CIM-PERM API', description: '權限管理（從 Express 遷移中）', api_base_url: 'http://cim-perm-api:3003' },
    ];
    for (const s of systems) {
        const created = await prisma.registeredSystem.upsert({
            where: { system_id: s.system_id },
            update: { name: s.name, description: s.description, api_base_url: s.api_base_url, status: SystemStatus.active },
            create: {
                system_id: s.system_id, name: s.name, description: s.description, api_base_url: s.api_base_url,
                allowed_roles: ['admin', 'auditor', 'editor', 'viewer'], created_by: 'jerry.sun@mrdi.org.hk', status: SystemStatus.active,
            },
        });
        console.log(`   ✓ ${created.system_id.padEnd(15)} → ${s.api_base_url}`);
    }
    // ---------- 3. API Keys ----------
    console.log('\n🔑 Seeding API keys (DEV ONLY — print once)...');
    console.log('   ─────────────────────────────────────────────────────────────────');
    const keyMap = {};
    for (const tag of ['mdm', 'rms', 'ims', 'perm']) {
        const { raw, hash, prefix } = genApiKey(tag);
        const sysId = tag === 'mdm' ? 'mdm-api' : tag === 'rms' ? 'cimrms-api' : tag === 'ims' ? 'cim-ims-api' : 'cim-perm-api';
        const sys = await prisma.registeredSystem.findUnique({ where: { system_id: sysId } });
        if (!sys)
            continue;
        // 先清掉同名旧 key（保证 seed 可重入）
        await prisma.apiKey.deleteMany({ where: { system_id: sys.id, prefix } });
        await prisma.apiKey.create({
            data: {
                system_id: sys.id,
                key_hash: hash,
                prefix,
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
        });
        keyMap[sysId] = raw;
        console.log(`   ${sysId.padEnd(15)} key: ${raw}`);
    }
    console.log('   ─────────────────────────────────────────────────────────────────');
    console.log('   ⚠️  Save these keys — they will NOT be shown again.\n');
    // ---------- 4. Permission Grants (test the grant path) ----------
    console.log('🛡️  Seeding permission grants (test /v1/permissions/check → grant path)...');
    const grants = [
        // editor → cimrms:admin （默认 editor 没有 admin，加 grant 后应该拿到）
        { user_email: 'editor@mrdi.org.hk', resource_id: 'cimrms', permission_id: 'cimrms:admin', expires_in_days: 30 },
        // viewer → cimrms:write （默认 viewer 没有 write）
        { user_email: 'viewer@mrdi.org.hk', resource_id: 'cimrms', permission_id: 'cimrms:write', expires_in_days: 7 },
        // auditor → cim-ims:read （默认 auditor 已有 *:read，这条 grant 用来验 status=active 过滤）
        { user_email: 'auditor@mrdi.org.hk', resource_id: 'cim-ims', permission_id: 'cim-ims:read', expires_in_days: 90 },
    ];
    for (const g of grants) {
        // 先清同 (user, resource, permission) 的旧 grant
        await prisma.permissionGrant.deleteMany({
            where: { user_email: g.user_email, resource_id: g.resource_id, permission_id: g.permission_id },
        });
        const created = await prisma.permissionGrant.create({
            data: {
                user_email: g.user_email,
                resource_id: g.resource_id,
                permission_id: g.permission_id,
                granted_via: GrantVia.manual,
                granted_by: 'jerry.sun@mrdi.org.hk',
                expires_at: new Date(Date.now() + g.expires_in_days * 24 * 60 * 60 * 1000),
                status: GrantStatus.active,
            },
        });
        console.log(`   ✓ ${g.user_email.padEnd(25)} → ${g.resource_id}:${g.permission_id.padEnd(15)} (${g.expires_in_days}d)`);
    }
    // ---------- 5. Audit Log (seed record) ----------
    console.log('\n📜 Seeding initial audit log...');
    await prisma.auditLog.create({
        data: {
            actor_email: 'jerry.sun@mrdi.org.hk',
            actor_name: 'Jerry Sun',
            action: 'system.seed',
            target_type: 'system',
            metadata: { note: 'Initial seed data inserted', version: '1.1.0' },
        },
    });
    console.log('   ✓ system.seed entry written');
    // ---------- 6. Todos (BB-06 demo data) ----------
    console.log('\n📋 Seeding sample todos...');
    const todos = [
        { owner_email: 'jerry.sun@mrdi.org.hk', source: 'mdm-api', title: 'Review Sprint 2 MDM API 验收清单', label: 'red', related_id: 'sprint-2' },
        { owner_email: 'editor@mrdi.org.hk', source: 'cimrms-api', title: '跟进 cimrms-api RBAC 进度', label: 'green', related_id: 'sprint-2' },
        { owner_email: 'jerry.sun@mrdi.org.hk', source: 'mrdi-portal', title: '本周 portal 登录 + CORS 验证', label: 'blue', related_id: 'sprint-2' },
    ];
    for (const t of todos) {
        await prisma.todo.upsert({
            where: { id: `seed-${t.owner_email}-${t.source}` },
            update: {},
            create: { ...t, id: `seed-${t.owner_email}-${t.source}` },
        }).catch(() => {
            // 重复 ID 时跳过
        });
        console.log(`   ✓ ${t.owner_email.padEnd(20)} → ${t.title.slice(0, 40)}...`);
    }
    console.log('\n✅ Seed done.');
    console.log('\n📌 Quick verify commands:');
    console.log('   curl http://localhost:3000/health');
    console.log('   curl "http://localhost:3000/auth/v1/dev/login?email=editor@mrdi.org.hk&role=editor"');
    console.log('   # POST /auth/v1/login 测试：jerry.sun@mrdi.org.hk / Jerry1234!');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
});
