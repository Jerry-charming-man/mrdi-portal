import { query, queryOne } from '../db/pool.js'
import type { PermTypeConfigRow, SystemOwnerRow } from '../types/index.js'

// ============================================================
// Perm Type Config
// ============================================================
export async function getPermTypes(): Promise<PermTypeConfigRow[]> {
  return query<PermTypeConfigRow>(
    `SELECT * FROM perm_type_config WHERE enabled = true ORDER BY code`
  )
}

export async function updatePermTypeConfig(
  code: string,
  updates: {
    default_duration?: string
    min_duration?:    string
    max_duration?:    string
    enabled?:         boolean
    updated_by?:      string
  }
): Promise<PermTypeConfigRow> {
  const sets: string[] = ['updated_at = NOW()']
  const vals: unknown[] = []
  let p = 1

  if (updates.default_duration) {
    sets.push(`default_duration = $${p++}`)
    vals.push(updates.default_duration)
  }
  if (updates.min_duration) {
    sets.push(`min_duration = $${p++}`)
    vals.push(updates.min_duration)
  }
  if (updates.max_duration) {
    sets.push(`max_duration = $${p++}`)
    vals.push(updates.max_duration)
  }
  if (updates.enabled !== undefined) {
    sets.push(`enabled = $${p++}`)
    vals.push(updates.enabled)
  }
  if (updates.updated_by) {
    sets.push(`updated_by = $${p++}`)
    vals.push(updates.updated_by)
  }

  vals.push(code)
  const row = await queryOne<PermTypeConfigRow>(
    `UPDATE perm_type_config SET ${sets.join(', ')} WHERE code = $${p} RETURNING *`,
    vals
  )
  return row!
}

// ============================================================
// System Owner Mapping
// ============================================================
export async function getSystemOwners(): Promise<SystemOwnerRow[]> {
  return query<SystemOwnerRow>(`SELECT * FROM system_owner_mapping ORDER BY system_code`)
}

export async function upsertSystemOwner(
  systemCode: string,
  ownerEmail: string,
  ownerName:  string,
  updatedBy:   string
): Promise<SystemOwnerRow> {
  const row = await queryOne<SystemOwnerRow>(
    `INSERT INTO system_owner_mapping (system_code, owner_email, owner_name, updated_by)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (system_code)
       DO UPDATE SET owner_email = $2, owner_name = $3, updated_by = $4
     RETURNING *`,
    [systemCode, ownerEmail, ownerName, updatedBy]
  )
  return row!
}

export async function getSystemOwner(systemCode: string): Promise<SystemOwnerRow | null> {
  return queryOne<SystemOwnerRow>(
    `SELECT * FROM system_owner_mapping WHERE system_code = $1`,
    [systemCode]
  )
}

// ============================================================
// Notification Settings
// ============================================================
export async function getNotifSettings(userEmail: string) {
  let row = await queryOne<{
    user_email: string; in_app: boolean; email: boolean
    bb06: boolean; expiring_reminder_hours: number
  }>(`SELECT * FROM notification_settings WHERE user_email = $1`, [userEmail])

  if (!row) {
    // Create default
    await query(
      `INSERT INTO notification_settings (user_email) VALUES ($1)`, [userEmail]
    )
    row = await queryOne(
      `SELECT * FROM notification_settings WHERE user_email = $1`, [userEmail]
    )
    return { user_email: userEmail, in_app: true, email: true, bb06: false, expiring_reminder_hours: 24 }
  }
  return row
}

export async function updateNotifSettings(
  userEmail: string,
  updates: {
    in_app?:                  boolean
    email?:                  boolean
    bb06?:                   boolean
    expiring_reminder_hours?: number
  }
) {
  const sets = ['updated_at = NOW()']
  const vals: unknown[] = []
  let p = 1

  if (updates.in_app !== undefined) {
    sets.push(`in_app = $${p++}`)
    vals.push(updates.in_app)
  }
  if (updates.email !== undefined) {
    sets.push(`email = $${p++}`)
    vals.push(updates.email)
  }
  if (updates.bb06 !== undefined) {
    sets.push(`bb06 = $${p++}`)
    vals.push(updates.bb06)
  }
  if (updates.expiring_reminder_hours !== undefined) {
    sets.push(`expiring_reminder_hours = $${p++}`)
    vals.push(updates.expiring_reminder_hours)
  }

  vals.push(userEmail)
  await query(
    `INSERT INTO notification_settings (user_email)
     VALUES ($${p})
     ON CONFLICT (user_email) DO UPDATE SET ${sets.join(', ')}`,
    vals
  )
}
