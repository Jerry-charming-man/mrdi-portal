// Note: env vars are loaded via loadEnv() in config/env.ts
const MDM_BASE = process.env.MDM_API_BASE || 'http://localhost:3000/mdm-api/v1'
const MDM_KEY  = process.env.MDM_API_KEY  || 'dev-key-change-in-production'

async function mdmFetch(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${MDM_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key':   MDM_KEY,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MDM API error ${res.status}: ${text}`)
  }
  return res.json()
}

export class MDMService {
  /**
   * Grant a permission via MDM
   * POST /mdm-api/v1/permissions/grant
   */
  async grantPermission(params: {
    user_email:  string
    resource_id:  string
    permission:  string   // e.g. "functional:read"
    expires_at:   Date
    granted_by:   string
  }): Promise<{ grant_id: string }> {
    try {
      const result = await mdmFetch('/permissions/grant', {
        user_email:    params.user_email,
        resource_id:   params.resource_id,
        permission:    params.permission,
        expires_at:    params.expires_at.toISOString(),
        granted_by:    params.granted_by,
      }) as { grant_id: string }
      return result
    } catch (e) {
      // In dev/stub mode, return a fake grant_id
      if (process.env.NODE_ENV === 'development') {
        console.warn('[MDM] DEV mode — returning fake grant_id')
        return { grant_id: 'dev-' + Math.random().toString(36).slice(2, 10) }
      }
      throw e
    }
  }

  /**
   * Revoke a permission via MDM
   * DELETE /mdm-api/v1/permissions/grant/{grantId}
   */
  async revokePermission(grantId: string): Promise<void> {
    try {
      const res = await fetch(`${MDM_BASE}/permissions/grant/${grantId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': MDM_KEY },
      })
      if (!res.ok && res.status !== 404) {
        const text = await res.text()
        throw new Error(`MDM revoke failed ${res.status}: ${text}`)
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[MDM] DEV mode — skipping revoke for ${grantId}`)
        return
      }
      throw e
    }
  }

  /**
   * Extend a permission via MDM
   * PATCH /mdm-api/v1/permissions/grant/{grantId}
   */
  async extendPermission(grantId: string, newExpiresAt: Date): Promise<void> {
    try {
      const res = await fetch(`${MDM_BASE}/permissions/grant/${grantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key':   MDM_KEY,
        },
        body: JSON.stringify({ expires_at: newExpiresAt.toISOString() }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`MDM extend failed ${res.status}: ${text}`)
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[MDM] DEV mode — skipping extend for ${grantId}`)
        return
      }
      throw e
    }
  }
}
