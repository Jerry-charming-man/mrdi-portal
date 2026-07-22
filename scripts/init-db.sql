-- ============================================================
-- MRDI Portal — Init DB Schemas
-- Loaded automatically by docker-compose on first postgres startup
-- File path: ./scripts/init-db.sql
-- ============================================================

-- 1. Create all schemas
CREATE SCHEMA IF NOT EXISTS mdm;
CREATE SCHEMA IF NOT EXISTS cimrms;
CREATE SCHEMA IF NOT EXISTS cimims;
CREATE SCHEMA IF NOT EXISTS cimperm;

-- 2. Grant to mrdi user (POSTGRES_USER=mrdi)
GRANT ALL ON SCHEMA mdm TO mrdi;
GRANT ALL ON SCHEMA cimrms TO mrdi;
GRANT ALL ON SCHEMA cimims TO mrdi;
GRANT ALL ON SCHEMA cimperm TO mrdi;

-- ============================================================
-- mdm (managed by mdm-api; schema inits via prisma db push)
-- ============================================================
-- mdm schema: User, RegisteredSystem, ApiKey, PermissionGrant, Todo, AuditLog, Session
-- Init via: cd mdm-api && pnpm db:push

-- ============================================================
-- cimrms schema (CIM-RMS — Requirement Management)
-- ============================================================
\i /docker-entrypoint-initdb.d/cimrms-schema.sql

-- ============================================================
-- cimims schema (CIM-IMS — Incident Management)
-- ============================================================
\i /docker-entrypoint-initdb.d/cimims-schema.sql

-- ============================================================
-- cimperm schema (CIM-PERM — Permission Request)
-- ============================================================
\i /docker-entrypoint-initdb.d/cimperm-schema.sql
