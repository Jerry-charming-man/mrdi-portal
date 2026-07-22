# MRDI Portal Â· æ··åˆç™»å½•è®¤è¯ PRD

> **Sprint 2** Â· v1.0 è‰æ¡ˆ Â· 2026-07-16
> **ä½œè€…**ï¼šMavis (æž¶æž„) + Jerry (ä¸šåŠ¡) è”åˆè¯„å®¡
> **ä¼˜å…ˆçº§**ï¼šP0ï¼ˆDR æˆ˜å¤‡çº§åˆšéœ€ + M365 å·²å°±ç»ªï¼‰
> **ç›®æ ‡ä¸Šçº¿**ï¼š2026-07-30

---

## 1. äº§å“æ¦‚è¿°

### 1.1 èƒŒæ™¯
MRDI Portal çŽ°æœ‰ `dev_login` ä¸´æ—¶ç™»å½•æœºåˆ¶ï¼ˆä»…æœ¬æœºçŽ¯å¢ƒå¯ç”¨ï¼‰ï¼ŒSprint 1 MVP å®ŒæˆåŽå¿…é¡»æ›¿æ¢ä¸ºç”Ÿäº§å¯ç”¨çš„è®¤è¯ç³»ç»Ÿã€‚

**ä¸šåŠ¡ç—›ç‚¹**ï¼š
1. ç”¨æˆ·å¿…é¡»è®° 1 ä¸ª Portal ä¸“å±žå¯†ç ï¼ˆå·²æœ‰ M365 è´¦å·ï¼‰
2. ç¦»èŒå‘˜å·¥è´¦å·æ— æ³•åŠæ—¶ç¦ç”¨
3. CIM-IMS æˆ˜å¤‡çº§è¦æ±‚ 100% å¯ç”¨ï¼ŒM365 å…¨å±€å®•æœº = å…¨å‘˜ç™»ä¸ä¸Š = åŽ‚åŒºåœæ‘†
4. æ¸¯åºœéžè¥åˆ©å—èµ„åŠ©æ–¹å®¡è®¡è¦æ±‚ SSO ç™»å½•æ¥æºå¯è¿½æº¯

### 1.2 è§£å†³æ–¹æ¡ˆï¼ˆä¸€å¥è¯ï¼‰
**M365 OAuth åšä¸»ç™»å½•ï¼ˆéªŒè¯èº«ä»½ï¼‰ï¼ŒMDM åšæƒå¨æŽˆæƒï¼ˆè§’è‰²æƒé™ï¼‰ï¼ŒMDM è‡ªå¸¦åº”æ€¥ç™»å½•åš DR å…œåº•ã€‚**

### 1.3 ç›®æ ‡ç”¨æˆ·
- **Mfg ä¸€çº¿ç”¨æˆ·**ï¼ˆçº¦ 200 äººï¼‰ï¼šæ—©ç­/ä¸­ç­/å¤œç­æŠ¥ä¿® + æéœ€æ±‚
- **PE/EE å·¥ç¨‹å¸ˆ**ï¼ˆçº¦ 50 äººï¼‰ï¼šå¼€å‘ + UAT
- **éƒ¨é—¨ Manager**ï¼ˆçº¦ 30 äººï¼‰ï¼šä¸šåŠ¡å®¡æ‰¹
- **IT-CIM å›¢é˜Ÿ**ï¼ˆçº¦ 15 äººï¼‰ï¼šç³»ç»Ÿè¿ç»´ + åº”æ€¥ç™»å½•
- **å¤–éƒ¨è®¿å®¢**ï¼ˆçº¦ 10 äºº/å¹´ï¼‰ï¼šä¸€æ¬¡æ€§ visitor è´¦å·

---

## 2. æ ¸å¿ƒåŠŸèƒ½æ¸…å•

### 2.1 å¿…é¡»æœ‰ (P0) Â· Sprint 2 å®Œæˆ

| ID | åŠŸèƒ½ | ä¼˜å…ˆçº§ | å¤æ‚åº¦ |
|----|------|--------|--------|
| F01 | M365 OAuth ç™»å½•ï¼ˆnormal flowï¼‰ | P0 | ä¸­ |
| F02 | MDM ç›´æŽ¥ç™»å½•ï¼ˆemergency flowï¼Œadmin å¯è§ï¼‰ | P0 | ä¸­ |
| F03 | TOTP åŒå› ç´ è®¤è¯ï¼ˆå¯é€‰å¯ç”¨ï¼Œadmin å¼ºåˆ¶å¯ç”¨ï¼‰ | P0 | ä¸­ |
| F04 | å¯†ç ç­–ç•¥ï¼š12 å­—ç¬¦ + 90 å¤©è¿‡æœŸ + 5 æ¬¡å¤±è´¥é”å®š 30 åˆ†é’Ÿ | P0 | å° |
| F05 | æ”¹å¯† + æ‰¾å›žå¯†ç æµç¨‹ | P0 | ä¸­ |
| F06 | MDM User è¡¨æ–°å¢ž auth å­—æ®µ | P0 | å° |
| F07 | dev_login æ”¹ä¸º admin-only emergency access | P0 | å° |
| F08 | ç™»å½•é¡µ UI æ”¹é€  | P0 | ä¸­ |
| F09 | ç™»å½•å¤±è´¥/é”å®š/è§’è‰²å˜æ›´å†™ AuditLog | P0 | å° |
| F10 | Session å¤±æ•ˆæ—¶è‡ªåŠ¨è·³ç™»å½•é¡µ | P0 | å° |

### 2.2 åº”è¯¥åš (P1) Â· Sprint 3 å®Œæˆ

| ID | åŠŸèƒ½ | ä¼˜å…ˆçº§ | å¤æ‚åº¦ |
|----|------|--------|--------|
| F11 | M365 Graph API åŒæ­¥ cronï¼ˆæ¯æ—¥ 6h æ‹‰ç”¨æˆ·ï¼‰ | P1 | ä¸­ |
| F12 | æ–°ç”¨æˆ·é¦–æ¬¡ç™»å½•å¼•å¯¼ï¼ˆæ”¹å¯† + å¯ç”¨ MFAï¼‰ | P1 | ä¸­ |
| F13 | ç™»å½•é¡µæ˜¾ç¤º"ä¸Šæ¬¡ç™»å½•æ—¶é—´ / IP"é˜²é’“é±¼ | P1 | å° |
| F14 | Admin æŽ§åˆ¶å°ï¼šç”¨æˆ·/è§’è‰²/é”å®šç®¡ç† | P1 | ä¸­ |

### 2.3 å¯ä»¥åš (P2) Â· Sprint 4+ è¯„ä¼°

- F15ï¼šè‡ªåŠ©æ³¨å†Œï¼ˆå¤–éƒ¨å·¥ç¨‹å¸ˆï¼‰
- F16ï¼šè®¾å¤‡ç»‘å®šï¼ˆä»…å¯ä¿¡è®¾å¤‡å¯ç™»å½•ï¼‰
- F17ï¼šåœ°ç†å¼‚å¸¸æ£€æµ‹
- F18ï¼šSSO trust extensionï¼ˆMES/ERP ç³»ç»ŸæŽ¥å…¥ï¼‰

---

## 3. ç”¨æˆ·äº¤äº’æµç¨‹ï¼ˆUser Flowsï¼‰

### 3.1 ä¸»æµç¨‹ï¼šM365 OAuth ç™»å½•ï¼ˆ99% åœºæ™¯ï¼‰

```
1. ç”¨æˆ·æ‰“å¼€ portalï¼ˆhttp://localhost:8089ï¼‰
2. portal æ£€æŸ¥ sessionStorage æ—  token â†’ è·³è½¬ /login
3. ç™»å½•é¡µæ˜¾ç¤ºä¸¤ä¸ªæŒ‰é’®ï¼š
   - å¤§æŒ‰é’®ï¼š"å…¬å¸è´¦å·ç™»å½•"ï¼ˆé»˜è®¤ï¼‰
   - å°æ–‡å­—ï¼š"åº”æ€¥ç™»å½•"ï¼ˆæŠ˜å åœ¨åº•éƒ¨ï¼Œéœ€ç‚¹å‡»å±•å¼€ï¼‰
4. ç”¨æˆ·ç‚¹"å…¬å¸è´¦å·ç™»å½•"
5. portal é‡å®šå‘åˆ° M365 OAuthï¼š
   https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
     client_id=...
     &response_type=code
     &redirect_uri=http://localhost:8089/auth/m365/callback
     &scope=openid+profile+email+User.Read
6. ç”¨æˆ·åœ¨ M365 é¡µé¢è¾“é‚®ç®± + å¯†ç  + MFAï¼ˆå¦‚æœ‰ï¼‰
7. M365 éªŒè¯é€šè¿‡ï¼Œé‡å®šå‘å›ž portal callback é¡µé¢ï¼Œå¸¦ code
8. portal ç”¨ code è°ƒ mdm-api: POST /auth/v1/m365/callback
   Body: { code, redirect_uri }
9. mdm-api ç”¨ code æ¢ access_token
10. mdm-api ç”¨ access_token è°ƒ Graph API: GET /me
    â†’ æ‹¿ email + name + department
11. mdm-api æŸ¥ User è¡¨ï¼ˆæŒ‰ emailï¼‰ï¼š
    - å­˜åœ¨ â†’ æ›´æ–° name/departmentï¼ˆå¦‚æœ‰å˜åŒ–ï¼‰
    - ä¸å­˜åœ¨ â†’ è‡ªåŠ¨åˆ›å»º Userï¼ˆstatus=active, role=viewerï¼‰
12. mdm-api ç­¾å‘ JWT (HS256, 8h)ï¼š
    Payload: { email, name, role, department, iat, exp }
13. portal æ”¶åˆ° JWTï¼Œå­˜ sessionStorageï¼Œè·³è½¬ /dashboard
14. portal è°ƒ 4 ä¸ª API éªŒè¯ JWT é€šè¿‡ â†’ æ­£å¸¸åŠ è½½
```

**è€—æ—¶**ï¼š< 3 ç§’ï¼ˆç»å¤§å¤šæ•°ç”¨æˆ·ï¼‰  
**å¤±è´¥ç‚¹**ï¼šM365 ä¸å¯è¾¾ / ç”¨æˆ·æœªåœ¨ M365 / å›žè°ƒ code è¿‡æœŸ

### 3.2 åº”æ€¥æµç¨‹ï¼šMDM ç›´æŽ¥ç™»å½•ï¼ˆCIM-IMS DR åœºæ™¯ï¼‰

```
1. ç™»å½•é¡µç”¨æˆ·ç‚¹"åº”æ€¥ç™»å½•"å±•å¼€
2. ç”¨æˆ·è¾“å…¥ï¼š
   - ç”¨æˆ·åï¼ˆæˆ– emailï¼‰
   - å¯†ç 
   - TOTP 6 ä½éªŒè¯ç ï¼ˆå¦‚æžœè¯¥è´¦å·å¯ç”¨äº† MFAï¼‰
3. portal è°ƒ mdm-api: POST /auth/v1/login
   Body: { username, password, totp_code? }
4. mdm-api éªŒè¯ï¼š
   - ç”¨æˆ·å­˜åœ¨
   - å¯†ç  bcrypt éªŒè¯é€šè¿‡
   - failed_login_count < 5
   - locked_until å·²è¿‡ / null
   - å¯†ç æœªè¿‡æœŸï¼ˆpassword_expires_at > nowï¼‰
   - TOTP éªŒè¯ï¼ˆå¦‚å¯ç”¨ï¼‰
5. é€šè¿‡ â†’ å¢žåŠ  last_login_atï¼Œé‡ç½® failed_login_count=0
6. ç­¾å‘ JWTï¼ˆåŒ M365 æµç¨‹ï¼‰
7. portal å­˜ JWTï¼Œè·³ dashboard
8. å†™ AuditLog: { event: "login.emergency", user_id, ip, ua }
```

**å¤±è´¥å¤„ç†**ï¼š
- å¯†ç é”™è¯¯ï¼šfailed_login_count + 1
- å¤±è´¥ 5 æ¬¡ï¼šlocked_until = now + 30minï¼Œè´¦å·é”å®š
- é”å®šä¸­ï¼šè¿”å›ž 423 Lockedï¼Œå‰ç«¯æ˜¾ç¤º"è´¦å·å·²é”å®šï¼Œ30 åˆ†é’ŸåŽé‡è¯•æˆ–è”ç³» admin"
- TOTP é”™è¯¯ï¼šmfa_failed_count + 1ï¼Œ3 æ¬¡é”™ä¹Ÿé”å®š

**è€—æ—¶**ï¼š< 1 ç§’

### 3.3 é¦–æ¬¡ç™»å½•å¼•å¯¼ï¼ˆä»… M365 æµç¨‹ï¼‰

```
1. M365 éªŒè¯é€šè¿‡ï¼Œmdm-api åˆ›å»ºæ–° User
2. mdm-api è¿”å›ž JWT + flag: first_login = true
3. portal æ£€æµ‹ first_login â†’ è·³è½¬ /welcome
4. æ¬¢è¿Žé¡µæç¤ºï¼š
   - "è¯·è®¾ç½® Portal ä¸“å±žå¯†ç ï¼ˆåº”æ€¥ç™»å½•ç”¨ï¼‰"
   - "å»ºè®®å¯ç”¨ MFAï¼ˆæ‰«ç ç»‘å®š Authenticatorï¼‰"
5. ç”¨æˆ·å¯é€‰æ‹©ï¼š
   - ä»…è®¾ç½®å¯†ç ï¼ˆæœ€å°å¯è¡Œï¼‰
   - è®¾ç½®å¯†ç  + å¯ç”¨ MFAï¼ˆæŽ¨èï¼‰
   - è·³è¿‡ï¼ˆä¸æŽ¨èï¼Œä½†å…è®¸ï¼‰
6. å®ŒæˆåŽè·³è½¬ /dashboard
```

### 3.4 å¯†ç ä¿®æ”¹æµç¨‹

```
1. ç”¨æˆ·åœ¨ Profile é¡µç‚¹"ä¿®æ”¹å¯†ç "
2. å¼¹å‡º Modalï¼š
   - å½“å‰å¯†ç ï¼ˆéªŒè¯èº«ä»½ï¼‰
   - æ–°å¯†ç ï¼ˆ2 æ¬¡ç¡®è®¤ï¼‰
   - å¯†ç å¼ºåº¦æç¤º
3. portal è°ƒ mdm-api: POST /auth/v1/change-password
   Body: { old_password, new_password }
4. mdm-api éªŒè¯æ—§å¯†ç ï¼Œbcrypt hash æ–°å¯†ç 
5. æ›´æ–° password_hash, password_expires_at = now + 90d
6. å†™ AuditLog: { event: "password.changed", user_id }
7. è¿”å›žæˆåŠŸï¼Œå‰ç«¯æç¤º"å¯†ç ä¿®æ”¹æˆåŠŸï¼Œä¸‹æ¬¡ç™»å½•ç”Ÿæ•ˆ"
```

### 3.5 å¯†ç æ‰¾å›žæµç¨‹

```
1. ç™»å½•é¡µç‚¹"å¿˜è®°å¯†ç "
2. è¾“å…¥ email â†’ mdm-api: POST /auth/v1/forgot-password
3. mdm-api ç”Ÿæˆ reset_tokenï¼ˆ30 åˆ†é’Ÿè¿‡æœŸï¼‰ï¼Œå†™ AuditLog
4. mdm-api å‘é€é‚®ä»¶ï¼ˆå¸¦ reset linkï¼‰
5. ç”¨æˆ·ç‚¹é‚®ä»¶é“¾æŽ¥ â†’ portal è·³è½¬ /auth/reset?token=...
6. ç”¨æˆ·è¾“å…¥æ–°å¯†ç  â†’ mdm-api: POST /auth/v1/reset-password
7. mdm-api éªŒè¯ token + æ”¹å¯† + æ ‡è®° token used
```

**æ³¨**ï¼šSprint 2 ä»…åšåŸºæœ¬æµç¨‹ï¼›Sprint 3 æŽ¥å…¥çœŸå®ž SMTPã€‚

### 3.6 è´¦å·é”å®š admin è§£é”

```
1. Admin åœ¨ admin æŽ§åˆ¶å°æ‰¾åˆ°ç›®æ ‡ç”¨æˆ·
2. ç‚¹"è§£é”" â†’ ç¡®è®¤ â†’ mdm-api: POST /v1/users/:id/unlock
3. mdm-apiï¼šfailed_login_count = 0, locked_until = null
4. å†™ AuditLog: { event: "user.unlocked", actor_id, target_id }
```

---

## 4. é¡µé¢æ¸…å•

| é¡µé¢ | è·¯å¾„ | è§¦å‘åœºæ™¯ | çŠ¶æ€ |
|------|------|----------|------|
| **Login** | `/login` | Session å¤±æ•ˆ / ä¸»åŠ¨ç™»å‡º | æ”¹é€  |
| Welcome | `/welcome` | M365 é¦–æ¬¡ç™»å½• | æ–°å»º |
| Forgot Password | `/forgot-password` | å¿˜è®°å¯†ç  | æ–°å»º |
| Reset Password | `/auth/reset` | é‚®ä»¶é“¾æŽ¥ | æ–°å»º |
| Profile | `/profile` | ç”¨æˆ·ä¸»åŠ¨æ”¹å¯† | å·²æœ‰ï¼Œæ‰©å±• |
| Admin Users | `/mdm/users` | admin ç®¡ç† | å·²æœ‰ï¼Œæ‰©å±• |
| Admin Audit | `/mdm/audit` | æŸ¥ç™»å½•æ—¥å¿— | å·²æœ‰ï¼Œæ‰©å±• |

### 4.1 Login é¡µ UI è‰å›¾

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                            â”‚
â”‚             [MRDI Logo]                     â”‚
â”‚                                            â”‚
â”‚            æ™ºèƒ½åˆ¶é€ è¿è¥é—¨æˆ·                  â”‚
â”‚                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  [Microsoft Logo] å…¬å¸è´¦å·ç™»å½•       â”‚  â”‚ â† ä¸»æŒ‰é’®
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                            â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ åº”æ€¥ç™»å½• â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€            â”‚ â† å¯æŠ˜å 
â”‚  ç”¨æˆ·å: [_____________________]            â”‚
â”‚  å¯†ç :   [_____________________]            â”‚
â”‚  TOTP:   [_ _ _ _ _ _]  (å¯ç”¨ MFA æ—¶)       â”‚
â”‚                                            â”‚
â”‚  [ å¿˜è®°å¯†ç  ]   [ é¦–æ¬¡ç™»å½•å¼•å¯¼ ]            â”‚
â”‚                                            â”‚
â”‚  Â© 2026 MRDI                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 4.2 Welcome é¡µï¼ˆé¦–æ¬¡ç™»å½•å¼•å¯¼ï¼‰

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  æ¬¢è¿Žï¼Œå¼ ä¸‰ ðŸ‘‹                              â”‚
â”‚                                            â”‚
â”‚  ä½ çš„è´¦å·å·²é€šè¿‡å…¬å¸è´¦å·ç™»å½•è‡ªåŠ¨åˆ›å»ºã€‚         â”‚
â”‚  ä¸ºäº†åº”æ€¥ç™»å½•å’Œè´¦å·å®‰å…¨ï¼Œå»ºè®®å®Œæˆä»¥ä¸‹è®¾ç½®ï¼š   â”‚
â”‚                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  1ï¸âƒ£  è®¾ç½® Portal ä¸“å±žå¯†ç               â”‚  â”‚
â”‚  â”‚  ç”¨äºŽ M365 ä¸å¯ç”¨æ—¶ç™»å½•                  â”‚  â”‚
â”‚  â”‚  [ç«‹å³è®¾ç½®]                             â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  2ï¸âƒ£  å¯ç”¨ MFA åŒå› ç´ è®¤è¯                â”‚  â”‚
â”‚  â”‚  æ‰«ç ç»‘å®š Authenticator                  â”‚  â”‚
â”‚  â”‚  [ç«‹å³å¯ç”¨]                             â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                            â”‚
â”‚  [ ç¨åŽè®¾ç½® ]   [ æˆ‘éƒ½è®¾ç½®å¥½äº† â†’ ]           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 4.3 é¡µé¢è·³è½¬å…³ç³»

```
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚  /login    â”‚ (å…¥å£)
        â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
              â”‚
    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
    â”‚         â”‚          â”‚
    â–¼         â–¼          â–¼
[M365 OAuth]  [åº”æ€¥ç™»å½•]  [å¿˜è®°å¯†ç ]
    â”‚         â”‚          â”‚
    â”‚         â”‚          â–¼
    â”‚         â”‚      [é‚®ä»¶é“¾æŽ¥]
    â”‚         â”‚          â”‚
    â”‚         â”‚          â–¼
    â”‚         â”‚      [/auth/reset]
    â”‚         â”‚          â”‚
    â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚
         â–¼
    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         (first_login=true)
    â”‚ /welcome â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
    â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜                  â”‚
          â”‚                       â”‚
          â–¼                       â”‚
      /dashboard  â—€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 5. æ•°æ®æ¨¡åž‹å˜æ›´ï¼ˆPrisma diff Â· ç›´æŽ¥ copy-pasteï¼‰

### 5.1 ä¿®æ”¹ `mdm-api/prisma/schema.prisma`

```prisma
// mdm-api/prisma/schema.prisma
// æ–‡ä»¶é¡¶éƒ¨ generator + datasource å·²æœ‰ï¼Œä¸‹é¢åªåˆ—å˜æ›´éƒ¨åˆ†

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  name        String
  department String?
  m365ObjectId String? @unique @map("m365_object_id")
  m365SyncedAt DateTime? @map("m365_synced_at")
  globalRole  String   @default("viewer") @map("global_role")
  status      String   @default("active") // active / inactive / locked
  managerId   String?  @map("manager_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // ===== Sprint 2 æ–°å¢ž =====
  // è®¤è¯
  passwordHash   String?  @map("password_hash")              // bcrypt cost=12
  totpSecret     String?  @map("totp_secret")                // TOTP secret (encrypted at rest)
  mfaEnabled     Boolean  @default(false) @map("mfa_enabled")
  mfaFailedCount Int      @default(0) @map("mfa_failed_count")
  
  // ç™»å½•æŽ§åˆ¶
  failedLoginCount   Int       @default(0) @map("failed_login_count")
  lockedUntil         DateTime? @map("locked_until")
  passwordExpiresAt   DateTime? @map("password_expires_at")
  lastLoginAt         DateTime? @map("last_login_at")
  lastLoginIp         String?   @map("last_login_ip") @db.VarChar(45) // IPv6 max
  lastLoginUa         String?   @map("last_login_ua") @db.Text
  
  // å¯†ç æ¢å¤
  passwordResetToken      String?   @map("password_reset_token")
  passwordResetExpiresAt DateTime? @map("password_reset_expires_at")
  
  // å…³ç³»
  manager     User?   @relation("UserManager", fields: [managerId], references: [id])
  reports     User[]  @relation("UserManager")
  sessions    Session[]
  apiKeys     ApiKey[]
  audits      AuditLog[]
  logins      LoginAudit[]   // æ–°å¢žåå‘å…³ç³»

  @@index([email])
  @@index([status])
  @@index([globalRole])
  @@index([failedLoginCount, lockedUntil])  // ç”¨äºŽé”å®šæ¸…ç† cron
  @@map("User")
  @@schema("mdm")
}

// ===== æ–°å¢žè¡¨ =====
model LoginAudit {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  email     String                                                // å³ä½¿ user åˆ äº†ä¹Ÿä¿ç•™å®¡è®¡
  event     String                                                // login.success / login.fail / account.locked / password.changed / mfa.enabled / mfa.disabled / password.reset
  flow      String                                                // m365 / emergency / reset / dev
  ip        String?  @db.VarChar(45)
  userAgent String?  @map("user_agent") @db.Text
  reason    String?  @db.Text                                    // å¤±è´¥åŽŸå› : wrong_password / totp_invalid / account_locked / mfa_required
  metadata  Json?                                                 // æ‰©å±•å­—æ®µï¼šdevice / location / risk_score ç­‰
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt(sort: Desc)])
  @@index([event, createdAt(sort: Desc)])
  @@index([email, createdAt(sort: Desc)])  // å³ä½¿ user åˆ äº†ä¹Ÿèƒ½æŸ¥
  @@map("LoginAudit")
  @@schema("mdm")
}
```

### 5.2 ç”Ÿæˆ migration çš„å‘½ä»¤

```bash
cd mdm-api

# 1. ç”Ÿæˆ migration
pnpm exec prisma migrate dev --name sprint2_auth_hybrid

# 2. æ£€æŸ¥ SQLï¼ˆé‡è¦ï¼çœ‹ prisma ç”Ÿæˆçš„ SQL æ˜¯ä¸æ˜¯ç¬¦åˆé¢„æœŸï¼‰
cat prisma/migrations/20260716_sprint2_auth_hybrid/migration.sql

# 3. åº”ç”¨åˆ° dev æ•°æ®åº“
pnpm exec prisma migrate deploy

# 4. éªŒè¯
pnpm exec prisma studio
# â†’ åº”è¯¥çœ‹åˆ° User è¡¨å¤šäº† 13 åˆ—
# â†’ åº”è¯¥çœ‹åˆ° LoginAudit æ–°è¡¨
```

### 5.3 Migration é£Žé™©ç‚¹

| é£Žé™© | ç¼“è§£ |
|------|------|
| çŽ°æœ‰ dev çŽ¯å¢ƒå·²æœ‰ User æ•°æ® | migration ç”¨ `DEFAULT NULL`ï¼Œä¸ä¼šç ´åçŽ°æœ‰è¡Œ |
| ç”Ÿäº§çŽ¯å¢ƒå¯èƒ½æ²¡åœ¨ prisma æµç¨‹ | æä¾›æ‰‹åŠ¨ SQL å¤‡ä»½æ–¹æ¡ˆï¼ˆè§ Â§12.3ï¼‰ |
| `@db.Text` / `@db.VarChar(45)` æ˜¯ PostgreSQL ä¸“æœ‰ | å½“å‰ DB æ˜¯ PGï¼ŒOKï¼›å°†æ¥æ¢åº“éœ€è°ƒæ•´ |

---

## 6. API è¯¦ç»†è§„èŒƒï¼ˆå¼€å‘å¯ copy-pasteï¼‰

> æ‰€æœ‰ endpoint éƒ½åœ¨ mdm-apiï¼Œè·¯å¾„å‰ç¼€ `/mdm-api/auth/v1/...`
> é€šç”¨è¯·æ±‚/å“åº”åŒ…è£…ï¼š`{ ok: true, data: ... }` / `{ ok: false, error: { code, message, details } }`
> é€šç”¨é”™è¯¯ç ï¼š`VALIDATION_ERROR` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` / `RATE_LIMITED` / `INTERNAL`

### 6.1 `POST /auth/v1/login`ï¼ˆåº”æ€¥ç™»å½•ï¼‰

**ç”¨é€”**ï¼šM365 ä¸å¯ç”¨æ—¶ï¼ˆDR åœºæ™¯ï¼‰ï¼Œç”¨æˆ·ç”¨ username/email + å¯†ç  + å¯é€‰ TOTP ç™»å½•

```yaml
# Request
{
  "username":  "zhang.zh@mrdi.example",   # email æˆ– usernameï¼ˆemail ä¼˜å…ˆï¼‰
  "password":  "Z3nG3!f4@2026",          # 12+ å­—ç¬¦ï¼Œbcrypt éªŒè¯
  "totp_code": "482917"                  # å¯é€‰ï¼›å¯ç”¨ MFA æ—¶å¿…å¡«
}

# Response 200
{
  "ok": true,
  "data": {
    "token":      "eyJhbGciOiJIUzI1NiIs...",  # JWT (HS256, 8h)
    "user": {
      "id":            "131e8e97-702a-49eb-bf0b-9e9b7903d1fd",
      "email":         "zhang.zh@mrdi.example",
      "name":          "å¼ å¿—è±ª",
      "department":    "CIM",
      "global_role":   "admin",
      "mfa_enabled":   true,
      "first_login":   false,
      "must_change_password": false
    },
    "expires_at":  1784194533,           # Unix timestamp
  }
}

# Response 401 INVALID_CREDENTIALS
{ "ok": false, "error": { "code": "INVALID_CREDENTIALS", "message": "ç”¨æˆ·åæˆ–å¯†ç é”™è¯¯" } }

# Response 401 MFA_REQUIRED
{ "ok": false, "error": { "code": "MFA_REQUIRED", "message": "è¯¥è´¦å·å·²å¯ç”¨ MFAï¼Œè¯·è¾“å…¥ 6 ä½éªŒè¯ç " } }

# Response 401 MFA_INVALID
{ "ok": false, "error": { "code": "MFA_INVALID", "message": "MFA éªŒè¯ç é”™è¯¯" } }

# Response 401 PASSWORD_EXPIRED
{ "ok": false, "error": { "code": "PASSWORD_EXPIRED", "message": "å¯†ç å·²è¿‡æœŸï¼Œè¯·é€šè¿‡'å¿˜è®°å¯†ç 'é‡ç½®" } }

# Response 423 ACCOUNT_LOCKED
{ "ok": false, "error": { "code": "ACCOUNT_LOCKED", "message": "è´¦å·å·²é”å®š", "retry_after": 1800 } }

# Response 403 ACCOUNT_INACTIVE
{ "ok": false, "error": { "code": "ACCOUNT_INACTIVE", "message": "è´¦å·å·²åœç”¨ï¼Œè¯·è”ç³»ç®¡ç†å‘˜" } }
```

**åŽç«¯é€»è¾‘**ï¼š
1. æŸ¥ User by email (lowercase normalize)
2. éªŒè¯ `status === 'active'`
3. éªŒè¯ `lockedUntil` å·²è¿‡ / null
4. éªŒè¯ `passwordHash` bcrypt
5. éªŒè¯ `mfaEnabled` â†’ å¦‚æ˜¯ï¼Œè¦æ±‚ totp_code
6. éªŒè¯ `passwordExpiresAt` æœªè¿‡æœŸ
7. æˆåŠŸ â†’ æ›´æ–° lastLoginAt/Ip/Ua + é‡ç½® failedLoginCount
8. å¤±è´¥ â†’ failedLoginCount + 1ï¼›å¦‚ â‰¥ 5ï¼ŒlockedUntil = now + 30min
9. å†™ LoginAuditï¼ˆæˆåŠŸ/å¤±è´¥éƒ½å†™ï¼‰

### 6.2 `POST /auth/v1/m365/callback`ï¼ˆM365 OAuth callbackï¼‰

**ç”¨é€”**ï¼šM365 OAuth æµç¨‹å®ŒæˆåŽï¼Œportal ç”¨ code æ¢ JWT

```yaml
# Request
{
  "code":         "0.AXAA...",             # M365 OAuth callback å¸¦çš„ code
  "redirect_uri": "http://localhost:8089/auth/m365/callback"
}

# Response 200
{
  "ok": true,
  "data": {
    "token":      "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... åŒä¸Š },
    "is_new_user": false,                 # true = M365 é¦–æ¬¡ç™»å½•ï¼ˆè‡ªåŠ¨åˆ›å»º Userï¼‰
    "first_login": false
  }
}

# Response 401 INVALID_M365_CODE
{ "ok": false, "error": { "code": "INVALID_M365_CODE", "message": "M365 code æ— æ•ˆæˆ–è¿‡æœŸ" } }

# Response 403 M365_USER_FORBIDDEN
{ "ok": false, "error": { "code": "M365_USER_FORBIDDEN", "message": "M365 ç”¨æˆ·è¢«ç¦ç”¨" } }

# Response 503 M365_UNAVAILABLE
{ "ok": false, "error": { "code": "M365_UNAVAILABLE", "message": "M365 æœåŠ¡æš‚ä¸å¯ç”¨ï¼Œè¯·ç¨åŽæˆ–ä½¿ç”¨åº”æ€¥ç™»å½•" } }
```

**åŽç«¯é€»è¾‘**ï¼š
1. ç”¨ code + M365 client_secret è°ƒ `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` æ¢ access_token
2. ç”¨ access_token è°ƒ Graph API `GET /me` æ‹¿ email + name + department
3. æŸ¥ User by emailï¼š
   - å­˜åœ¨ â†’ æ›´æ–° name/departmentï¼ˆå¦‚æœ‰å˜åŒ–ï¼‰
   - ä¸å­˜åœ¨ â†’ è‡ªåŠ¨åˆ›å»º Userï¼ˆstatus=active, role=viewer, is_new_user=trueï¼‰
4. ç­¾å‘ JWT
5. å†™ LoginAudit

### 6.3 `POST /auth/v1/change-password`ï¼ˆæ”¹å¯†ï¼‰

```yaml
# Request
{
  "old_password": "OldPass!2024",
  "new_password": "N3wP@ss!2026#"
}

# Response 200
{ "ok": true, "data": { "changed": true } }

# Response 401 OLD_PASSWORD_INVALID
{ "ok": false, "error": { "code": "OLD_PASSWORD_INVALID", "message": "å½“å‰å¯†ç é”™è¯¯" } }

# Response 422 PASSWORD_TOO_WEAK
{ "ok": false, "error": { "code": "PASSWORD_TOO_WEAK", "message": "æ–°å¯†ç å¼ºåº¦ä¸è¶³", "details": { "issues": ["need_uppercase", "need_digit", "need_special"] } } }

# Response 422 PASSWORD_REUSED
{ "ok": false, "error": { "code": "PASSWORD_REUSED", "message": "ä¸èƒ½ä½¿ç”¨æœ€è¿‘ 5 æ¬¡ç”¨è¿‡çš„å¯†ç " } }
```

**åŽç«¯é€»è¾‘**ï¼š
1. éªŒ JWTï¼ˆauth middlewareï¼‰
2. éªŒæ—§å¯†ç 
3. éªŒæ–°å¯†ç å¼ºåº¦ï¼ˆ12 å­—ç¬¦ + å¤§å†™ + å°å†™ + æ•°å­— + ç‰¹æ®Šå­—ç¬¦ï¼‰
4. æ£€æŸ¥æœ€è¿‘ 5 æ¬¡å¯†ç ä¸é‡ç”¨ï¼ˆéœ€è¦ `PasswordHistory` è¡¨ï¼ŒSprint 2 ä¸å®žçŽ°ï¼Œè®° TODOï¼‰
5. bcrypt hash æ–°å¯†ç ï¼Œæ›´æ–° passwordHash + passwordExpiresAt = now + 90d
6. å†™ LoginAudit

### 6.4 `POST /auth/v1/forgot-password`ï¼ˆå¿˜è®°å¯†ç ï¼‰

```yaml
# Request
{ "email": "zhang.zh@mrdi.example" }

# Response 200ï¼ˆæ°¸è¿œè¿”å›ž 200ï¼Œé¿å…æ³„éœ²ç”¨æˆ·å­˜åœ¨æ€§ï¼‰
{ "ok": true, "data": { "message": "å¦‚æžœè¯¥é‚®ç®±å­˜åœ¨ï¼Œé‡ç½®é“¾æŽ¥å·²å‘é€" } }
```

**åŽç«¯é€»è¾‘**ï¼š
1. æŸ¥ User by email
2. å¦‚å­˜åœ¨ï¼š
   - ç”Ÿæˆ `passwordResetToken = crypto.randomUUID()`
   - `passwordResetExpiresAt = now + 30min`
   - å‘é‚®ä»¶ï¼ˆdev çŽ¯å¢ƒç”¨ `console.log` æ‰“å° reset linkï¼‰
3. å†™ LoginAudit (event=password.reset.requested)
4. **æ°¸è¿œè¿”å›ž 200**ï¼Œä¸æš´éœ²ç”¨æˆ·å­˜åœ¨æ€§

### 6.5 `POST /auth/v1/reset-password`ï¼ˆé‡ç½®å¯†ç ï¼‰

```yaml
# Request
{
  "token":        "550e8400-e29b-41d4-a716-446655440000",
  "new_password": "N3wP@ss!2026#"
}

# Response 200
{ "ok": true, "data": { "message": "å¯†ç å·²é‡ç½®ï¼Œè¯·ç”¨æ–°å¯†ç ç™»å½•" } }

# Response 401 INVALID_RESET_TOKEN
{ "ok": false, "error": { "code": "INVALID_RESET_TOKEN", "message": "é‡ç½®é“¾æŽ¥æ— æ•ˆæˆ–å·²è¿‡æœŸ" } }
```

### 6.6 `POST /auth/v1/mfa/enable`ï¼ˆå¯ç”¨ MFAï¼‰

```yaml
# Response 200
{
  "ok": true,
  "data": {
    "secret":     "JBSWY3DPEHPK3PXP",          # base32 TOTP secret
    "qr_code":    "data:image/png;base64,...",  # äºŒç»´ç å›¾ç‰‡ï¼ˆotpauth://totp/...ï¼‰
    "manual_key": "JBSWY3DPEHPK3PXP"            # æ‰‹åŠ¨è¾“å…¥ç”¨
  }
}
```

**æµç¨‹**ï¼š
1. åŽç«¯ç”Ÿæˆ TOTP secret
2. æš‚æ—¶å­˜åˆ° User.totpSecretï¼ˆä½† mfaEnabled è¿˜æ˜¯ falseï¼‰
3. è¿”å›ž secret + äºŒç»´ç 
4. ç”¨æˆ·ç”¨ Authenticator æ‰«ç 
5. ç”¨æˆ·è°ƒ `POST /auth/v1/mfa/verify` æäº¤ 6 ä½éªŒè¯ç 
6. åŽç«¯éªŒè¯é€šè¿‡åŽï¼Œ**æ‰æŠŠ mfaEnabled è®¾ä¸º true**

### 6.7 `POST /auth/v1/mfa/verify`ï¼ˆéªŒè¯ MFA å¯ç”¨éªŒè¯ç ï¼‰

```yaml
# Request
{ "code": "482917" }

# Response 200
{ "ok": true, "data": { "mfa_enabled": true } }

# Response 401 MFA_INVALID
{ "ok": false, "error": { "code": "MFA_INVALID", "message": "éªŒè¯ç é”™è¯¯ï¼Œè¯·é‡è¯•" } }
```

### 6.8 `DELETE /auth/v1/mfa`ï¼ˆå…³é—­ MFAï¼‰

```yaml
# Response 200
{ "ok": true, "data": { "mfa_enabled": false } }

# Response 401 PASSWORD_REQUIRED
# Body å¿…é¡»å« password éªŒè¯
{
  "password": "Z3nG3!f4@2026"
}
```

### 6.9 `GET /auth/v1/mfa/qrcode`ï¼ˆé‡æ–°ç”Ÿæˆ MFA äºŒç»´ç ï¼‰

**ç”¨é€”**ï¼šç”¨æˆ·ä¸¢å¤± Authenticator è®¾å¤‡ä½†è¿˜èƒ½ç™»å½•ï¼ˆåº”æ€¥æµç¨‹ï¼‰ï¼Œéœ€è¦é‡æ–°æ‰«ç 

```yaml
# Response 200
{
  "ok": true,
  "data": {
    "secret":     "...",
    "qr_code":    "data:image/png;base64,...",
    "manual_key": "..."
  }
}
```

### 6.10 `GET /auth/v1/me`ï¼ˆæ‰©å±•ï¼‰

```yaml
# Response 200
{
  "ok": true,
  "data": {
    "id":               "131e8e97-...",
    "email":            "zhang.zh@mrdi.example",
    "name":             "å¼ å¿—è±ª",
    "department":       "CIM",
    "global_role":      "admin",
    "mfa_enabled":      true,
    "last_login_at":    "2026-07-16T16:30:00Z",
    "last_login_ip":    "10.20.30.40",
    "must_change_password": false,    # 90 å¤©è¿‡æœŸå‰ 7 å¤©å¼€å§‹è¿”å›ž true
    "is_new_user":      false          # é¦–æ¬¡ç™»å½•ï¼ˆç”¨äºŽ welcome é¡µè·³è½¬åˆ¤æ–­ï¼‰
  }
}
```

### 6.11 admin è·¯ç”±ï¼ˆ`/v1/users/:id/unlock` + `/reset-password`ï¼‰

```yaml
# POST /v1/users/:id/unlock
# Response 200
{ "ok": true, "data": { "unlocked": true } }

# POST /v1/users/:id/reset-password
# Request
{ "new_password": "T3mpP@ss!2026" }  # admin ä¸´æ—¶æ”¹å¯†ï¼Œå¼ºåˆ¶ç”¨æˆ·é¦–æ¬¡ç™»å½•æ—¶æ”¹

# Response 200
{ "ok": true, "data": { "reset": true, "must_change_password": true } }
```

**æƒé™**ï¼šä»… `global_role === 'admin'` å¯è°ƒ

### 6.12 ä¿®æ”¹çŽ°æœ‰è·¯ç”±

```yaml
# POST /auth/v1/dev/loginï¼ˆä¿ç•™ä½†æ”¶ç´§ï¼‰
# Requestï¼ˆæ–°å¢ž admin_key å­—æ®µï¼‰
{
  "email":     "admin@mrdi.example",
  "role":      "admin",
  "department": "CIM",
  "admin_key": "dev-admin-key-from-env"     # æ–°å¢žï¼šå¿…é¡»åŒ¹é… env ADMIN_KEY
}

# è¡Œä¸ºå˜åŒ–ï¼š
# - æ—  admin_key â†’ è¿”å›ž 403 EMERGENCY_ACCESS_DISABLED
# - NODE_ENV=production + æ—  admin_key â†’ ç«¯ç‚¹æ•´ä½“ç¦ç”¨ï¼ˆå¯åŠ¨æ—¶æ£€æŸ¥ï¼‰
# - ä¿ç•™ 7 å¤©è¿‡æ¸¡æœŸï¼ˆv1.0.7 ä¹‹å‰ï¼‰ï¼Œç»™çŽ°æœ‰ç”¨æˆ·åˆ‡æ¢æ—¶é—´
```

---


## 7. éžåŠŸèƒ½æ€§éœ€æ±‚

### 7.1 å®‰å…¨
- å¯†ç ï¼šbcrypt cost â‰¥ 12ï¼Œæœ€å° 12 å­—ç¬¦ï¼ˆå«å¤§å°å†™+æ•°å­—+ç‰¹æ®Šå­—ç¬¦ï¼‰
- TOTPï¼š30s çª—å£ï¼Œå…è®¸ Â±1 æ­¥åå·®
- Session JWTï¼šHS256ï¼Œ8h è¿‡æœŸï¼Œå¯é…ç½®
- HTTPS onlyï¼ˆç”Ÿäº§çŽ¯å¢ƒï¼‰
- ç™»å½•å¤±è´¥æ—¥å¿—ï¼šåŒ…å« IP + UA + æ—¶é—´ï¼Œä¿ç•™ 90 å¤©
- é”å®šç­–ç•¥ï¼š5 æ¬¡å¤±è´¥é” 30 åˆ†é’Ÿï¼›MFA å¤±è´¥ 3 æ¬¡é” 30 åˆ†é’Ÿ

### 7.2 æ€§èƒ½
- ç™»å½•å“åº”æ—¶é—´ P95 < 500ms
- TOTP éªŒè¯ P95 < 100ms
- M365 OAuth callback æ€»è€—æ—¶ P95 < 3s

### 7.3 å¯ç”¨æ€§
- M365 ä¸å¯ç”¨æ—¶ï¼Œåº”æ€¥ç™»å½•ä»å¯ç”¨
- åº”æ€¥ç™»å½•å…¥å£åœ¨ M365 å¤±è´¥ 2 æ¬¡åŽè‡ªåŠ¨å±•å¼€ï¼ˆå‹å¥½é™çº§ï¼‰

### 7.4 å…¼å®¹æ€§
- å‰ç«¯ React 19 + Vite 5
- M365 OAuth 2.0 + OpenID Connect
- æµè§ˆå™¨ï¼šChrome 100+ / Edge 100+ / Safari 15+ / Firefox 100+

---

## 8. éªŒæ”¶æ ‡å‡†

### 8.1 åŠŸèƒ½éªŒæ”¶
- [ ] M365 OAuth ç™»å½•ï¼šèƒ½ç”¨å…¬å¸é‚®ç®±æˆåŠŸç™»å½•
- [ ] M365 é¦–æ¬¡ç™»å½•ï¼šè‡ªåŠ¨åˆ›å»º Userï¼Œè·³æ¬¢è¿Žé¡µ
- [ ] M365 å†æ¬¡ç™»å½•ï¼šç›´æŽ¥è·³ dashboard
- [ ] åº”æ€¥ç™»å½•ï¼šèƒ½ç”¨ username + å¯†ç ç™»å½•
- [ ] åº”æ€¥ç™»å½• + MFAï¼šTOTP éªŒè¯é€šè¿‡æ‰èƒ½ç™»å½•
- [ ] 5 æ¬¡å¯†ç é”™è¯¯ï¼šè´¦å·é”å®š 30 åˆ†é’Ÿ
- [ ] é”å®šä¸­ç™»å½•ï¼šè¿”å›ž 423ï¼Œå‰ç«¯å‹å¥½æç¤º
- [ ] æ”¹å¯†æˆåŠŸï¼šä¸‹æ¬¡ç™»å½•ç”¨æ–°å¯†ç 
- [ ] 90 å¤©è¿‡æœŸï¼šæ—§å¯†ç ç™»å½•å¤±è´¥ï¼Œæç¤ºæ”¹å¯†
- [ ] å¿˜è®°å¯†ç é‚®ä»¶ï¼šèƒ½æ”¶åˆ°é‚®ä»¶ï¼ˆdev çŽ¯å¢ƒç”¨ console.logï¼‰
- [ ] é‡ç½®å¯†ç  token 30 åˆ†é’Ÿè¿‡æœŸ
- [ ] dev_loginï¼šproduction çŽ¯å¢ƒç¦ç”¨ / admin key æ¨¡å¼å¯ç”¨

### 8.2 å®‰å…¨éªŒæ”¶
- [ ] å¯†ç åœ¨ DB ä¸­ä»¥ bcrypt å­˜å‚¨ï¼ˆä¸å¯é€†ï¼‰
- [ ] ç™»å½•å¤±è´¥æ—¥å¿—å®Œæ•´
- [ ] é”å®šçŠ¶æ€å‰ç«¯æ— æ³•ç»•è¿‡
- [ ] Session è¿‡æœŸåŽè‡ªåŠ¨è·³ç™»å½•é¡µ

### 8.3 æ€§èƒ½éªŒæ”¶
- [ ] ç™»å½• P95 < 500ms
- [ ] 10 å¹¶å‘ç™»å½•ä¸æŠ¥é”™
- [ ] 1000 è¿žç»­ç™»å½•å¤±è´¥ä¸æŒ‚ï¼ˆé™æµä¿æŠ¤ï¼‰

---

## 9. é£Žé™©ä¸Žå›žæ»š

| é£Žé™© | æ¦‚çŽ‡ | å½±å“ | ç¼“è§£ |
|------|------|------|------|
| M365 OAuth é…ç½®é”™è¯¯ | ä¸­ | é«˜ | dev çŽ¯å¢ƒå…ˆç”¨ mock IDP è·‘é€šï¼Œå†åˆ‡çœŸå®ž |
| å¯†ç æ‰¾å›žé‚®ä»¶æœªé… SMTP | é«˜ | ä¸­ | Sprint 2 ç”¨ console.log å ä½ï¼›Sprint 3 æŽ¥å…¥ SMTP |
| TOTP è®¾å¤‡ä¸¢å¤± | ä½Ž | é«˜ | Admin å¯é‡ç½®ç”¨æˆ· MFAï¼›ç”¨æˆ·èµ°æ‰¾å›žå¯†ç  |
| bcrypt cost=12 å½±å“æ€§èƒ½ | ä½Ž | ä½Ž | é¢„ç•™å¯é…ç½®ï¼›ç›‘æŽ§ç™»å½•å“åº”æ—¶é—´ |
| M365 å…¨å±€å®•æœº | ä½Ž | é«˜ | åº”æ€¥ç™»å½•å…œåº•ï¼›CIM-IMS æ°¸ä¸åœæ‘† |

**å›žæ»šæ–¹æ¡ˆ**ï¼šæ‰€æœ‰å˜æ›´é€šè¿‡ feature flag æŽ§åˆ¶ï¼›å¦‚ M365 OAuth å‡ºé—®é¢˜ï¼Œå¯ä¸´æ—¶å…³é—­ `/auth/v1/m365/callback` ç«¯ç‚¹ï¼Œä»…ä¿ç•™åº”æ€¥ç™»å½•ã€‚

---

## 10. ä¸åœ¨ Sprint 2 èŒƒå›´å†…ï¼ˆæ˜Žç¡®ï¼‰

- âŒ M365 åŒæ­¥ cronï¼ˆSprint 3ï¼‰
- âŒ çœŸå®ž SMTP æŽ¥å…¥ï¼ˆSprint 3ï¼‰
- âŒ è®¾å¤‡ç»‘å®š / åœ°ç†å¼‚å¸¸æ£€æµ‹ï¼ˆSprint 4+ï¼‰
- âŒ è‡ªåŠ©æ³¨å†Œå¤–éƒ¨å·¥ç¨‹å¸ˆï¼ˆSprint 4+ï¼‰
- âŒ MES/ERP ç³»ç»ŸæŽ¥å…¥ï¼ˆSprint 5+ï¼‰

---

## 11. å®žæ–½åˆ†è§£

| ä»»åŠ¡ | å·¥æ—¶ | ä¾èµ– |
|------|------|------|
| T1: Prisma schema å˜æ›´ + migration | 0.5d | â€” |
| T2: åŽç«¯ User è¡¨æ–°å¢žå­—æ®µ | 0.5d | T1 |
| T3: åŽç«¯ LoginAudit è¡¨ + ç´¢å¼• | 0.5d | T1 |
| T4: åŽç«¯ bcrypt + å¯†ç ç­–ç•¥ | 0.5d | T2 |
| T5: åŽç«¯ TOTP å·¥å…·ï¼ˆotplibï¼‰ | 0.5d | â€” |
| T6: åŽç«¯ åº”æ€¥ç™»å½• endpoint | 1d | T2,T4,T5 |
| T7: åŽç«¯ M365 OAuth callback | 1.5d | T2 |
| T8: åŽç«¯ æ”¹å¯† / æ‰¾å›ž / é‡ç½® | 1d | T4 |
| T9: åŽç«¯ dev_login æ”¹é€  | 0.5d | â€” |
| T10: åŽç«¯ é”å®š/è§£é” API | 0.5d | T2 |
| T11: å‰ç«¯ Login é¡µæ”¹é€  | 1d | â€” |
| T12: å‰ç«¯ Welcome é¡µï¼ˆé¦–æ¬¡ç™»å½•ï¼‰ | 0.5d | T7 |
| T13: å‰ç«¯ Forgot/Reset é¡µ | 0.5d | T8 |
| T14: å‰ç«¯ Profile æ”¹å¯† | 0.5d | T8 |
| T15: å‰ç«¯ MFA å¯ç”¨å¼•å¯¼ | 0.5d | T5 |
| T16: é›†æˆæµ‹è¯• | 1d | T1-T15 |
| T17: æ–‡æ¡£æ›´æ–° | 0.5d | â€” |

**æ€»å·¥æ—¶**ï¼š~12.5 å¤© Â· é€‚åˆ 2 å‘¨ Sprint

---

## 12. æ•°æ®åº“è¿ç§»æ¸…å•ï¼ˆè¿ç»´å¿…è¯»ï¼‰

> éƒ¨ç½² Sprint 2 å¿…èµ° 6 æ­¥ï¼ŒæŒ‰é¡ºåºæ‰§è¡Œã€‚æ¯æ­¥éƒ½æœ‰éªŒè¯å‘½ä»¤ã€‚

### 12.1 ç¬¬ 1 æ­¥ï¼šå¤‡ä»½ï¼ˆå¿…åšï¼‰

```bash
# 1.1 å¤‡ä»½æ•´ä¸ª PostgreSQLï¼ˆå³ä½¿ dev çŽ¯å¢ƒä¹Ÿè¦ï¼‰
docker exec mrdi-postgres pg_dump -U mrdi -d mrdi -n mdm -F c -f /tmp/mdm_backup_$(date +%Y%m%d_%H%M).dump
docker cp mrdi-postgres:/tmp/mdm_backup_*.dump ./backups/

# 1.2 éªŒè¯å¤‡ä»½æ–‡ä»¶å¤§å°ï¼ˆä¸èƒ½æ˜¯ 0 å­—èŠ‚ï¼‰
ls -lh ./backups/mdm_backup_*.dump
# é¢„æœŸï¼š> 100KBï¼ˆå–å†³äºŽ User è¡¨æœ‰å¤šå°‘è¡Œï¼‰
```

### 12.2 ç¬¬ 2 æ­¥ï¼šPrisma migration

```bash
cd mdm-api

# 2.1 ç”Ÿæˆ migrationï¼ˆè‡ªåŠ¨èµ· dev æ ¡éªŒ SQLï¼‰
pnpm exec prisma migrate dev --name sprint2_auth_hybrid

# 2.2 æ£€æŸ¥ç”Ÿæˆçš„ SQLï¼ˆdev å¿…é¡»çœ‹ä¸€éï¼ï¼‰
cat prisma/migrations/20260716_sprint2_auth_hybrid/migration.sql
# é¢„æœŸçœ‹åˆ°ï¼š
#   ALTER TABLE "mdm"."User" ADD COLUMN "password_hash" TEXT;
#   ALTER TABLE "mdm"."User" ADD COLUMN "totp_secret" TEXT;
#   ... (å…± 13 ä¸ªå­—æ®µ)
#   CREATE TABLE "mdm"."LoginAudit" (...);

# 2.3 åº”ç”¨åˆ° dev
pnpm exec prisma migrate deploy

# 2.4 éªŒè¯ï¼ˆç”¨ prisma studio çœ‹ä¸€çœ¼ï¼‰
pnpm exec prisma studio
# â†’ User è¡¨åº”æ–°å¢ž 13 åˆ—ï¼ˆå…¨éƒ¨ NULL å…è®¸ï¼‰
# â†’ æ–°è¡¨ LoginAudit åº”å­˜åœ¨ï¼ˆ0 è¡Œï¼‰
```

### 12.3 ç¬¬ 3 æ­¥ï¼šçŽ°æœ‰ç”¨æˆ·æ•°æ®è¿ç§»

> dev çŽ¯å¢ƒå½“å‰æ‰€æœ‰ User çš„ `passwordHash` éƒ½æ˜¯ NULLã€‚Sprint 2 ä¸Šçº¿åŽä»–ä»¬å¿…é¡»**èµ°"å¿˜è®°å¯†ç "æµç¨‹**æ‰èƒ½ç™»å½•ã€‚

**3.1 å‡†å¤‡"æ‰¹é‡é‡ç½®å¯†ç "SQL**ï¼ˆä»…ç”Ÿäº§ç”¨ï¼Œdev è·³è¿‡ï¼‰ï¼š

```sql
-- ç»™æ‰€æœ‰çŽ°æœ‰ç”¨æˆ·ç”Ÿæˆ reset tokenï¼ˆ30 å¤©è¿‡æœŸï¼‰
-- è®©ä»–ä»¬èµ° forgot-password æµç¨‹
UPDATE "mdm"."User"
SET password_reset_token = gen_random_uuid()::text,
    password_reset_expires_at = NOW() + INTERVAL '30 days'
WHERE password_hash IS NULL;
-- é¢„æœŸå½±å“ï¼šæ‰€æœ‰çŽ°æœ‰ User è¡Œ

-- ï¼ˆå¯é€‰ï¼‰ç»™æ‰€æœ‰çŽ°æœ‰ç”¨æˆ·åŠ é»˜è®¤å¯†ç è¿‡æœŸæ—¶é—´
UPDATE "mdm"."User"
SET password_expires_at = NOW() + INTERVAL '90 days'
WHERE password_expires_at IS NULL;
```

**3.2 å‘"å¯†ç é‡ç½®é‚®ä»¶"**ï¼ˆdev çŽ¯å¢ƒç”¨ console.log å ä½ï¼‰ï¼š

```typescript
// Sprint 2 å®žçŽ°çš„è„šæœ¬
// scripts/notify-users-to-reset-password.ts

import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../src/lib/email';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { passwordHash: null, status: 'active' }
  });
  
  console.log(`æ‰¾åˆ° ${users.length} ä¸ªéœ€è¦é‡ç½®å¯†ç çš„ç”¨æˆ·`);
  
  for (const user of users) {
    const token = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: crypto.randomUUID(),
        passwordResetExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const resetUrl = `http://localhost:8089/auth/reset?token=${token.passwordResetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'ã€MRDI Portalã€‘è¯·è®¾ç½®æ‚¨çš„ Portal è´¦å·å¯†ç ',
      body: `æ‚¨å¥½ ${user.name}ï¼Œ\n\nMRDI Portal å·²å‡çº§è®¤è¯ç³»ç»Ÿã€‚è¯·ç‚¹å‡»ä»¥ä¸‹é“¾æŽ¥è®¾ç½®æ‚¨çš„ Portal è´¦å·å¯†ç ï¼ˆ30 å¤©å†…æœ‰æ•ˆï¼‰ï¼š\n${resetUrl}\n\nè®¾ç½®åŽå³å¯ä½¿ç”¨é‚®ç®±+å¯†ç ç™»å½•ã€‚å¦‚ä½¿ç”¨ M365 ç™»å½•å¯å¿½ç•¥æ­¤é‚®ä»¶ã€‚`
    });
    
    console.log(`âœ“ é‚®ä»¶å·²å‘é€: ${user.email}`);
  }
}

main();
```

**3.3 è·‘è¿ç§»è„šæœ¬**ï¼š

```bash
cd mdm-api
pnpm exec tsx scripts/notify-users-to-reset-password.ts
```

### 12.4 ç¬¬ 4 æ­¥ï¼šä¿ç•™ dev_login 7 å¤©è¿‡æ¸¡

**ç›®çš„**ï¼šè®©çŽ°æœ‰ dev ç”¨æˆ·æœ‰æ—¶é—´åˆ‡åˆ°æ–°æµç¨‹ï¼Œé¿å…"ä¸Šçº¿å½“å¤©å…¨å‘˜ç™»ä¸ä¸Š"ã€‚

```bash
# 4.1 åœ¨ .env åŠ æ–°å˜é‡
echo "ADMIN_KEY=dev-admin-key-2026-mrdi-change-in-prod" >> .env

# 4.2 é‡å¯ mdm-api å®¹å™¨
cd C:/M0056/20-AI/40-Minimax/Portal
docker compose restart mdm-api
```

**dev_login è¡Œä¸ºå˜åŒ–**ï¼š
- æ²¡ `admin_key` å­—æ®µ â†’ è¿”å›ž 403 EMERGENCY_ACCESS_DISABLED
- æœ‰ `admin_key` ä½†ä¸åŒ¹é… â†’ è¿”å›ž 403
- æœ‰ `admin_key` ä¸”åŒ¹é… â†’ æ­£å¸¸è¿”å›ž JWT
- **ç”Ÿäº§çŽ¯å¢ƒï¼ˆNODE_ENV=productionï¼‰å¯åŠ¨æ—¶æ ¡éªŒ ADMIN_KEYï¼Œæœªè®¾ç½®åˆ™ dev_login ç«¯ç‚¹ç›´æŽ¥ 404**

### 12.5 ç¬¬ 5 æ­¥ï¼šè§‚å¯ŸæœŸï¼ˆ7 å¤©ï¼‰

```bash
# 5.1 æ¯å¤©æ£€æŸ¥ dev_login è°ƒç”¨æƒ…å†µ
docker logs mdm-api 2>&1 | grep "dev_login" | tail -20

# 5.2 æ¯å¤©æ£€æŸ¥ LoginAudit ç™»å½•æˆåŠŸçŽ‡
docker exec mrdi-postgres psql -U mrdi -d mrdi -c "
SELECT 
  flow,
  event,
  COUNT(*) as count
FROM mdm.\"LoginAudit\"
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY flow, event
ORDER BY count DESC;
"

# 5.3 7 å¤©åŽæ—  dev_login è°ƒç”¨ â†’ è¿›å…¥ç¬¬ 6 æ­¥
```

### 12.6 ç¬¬ 6 æ­¥ï¼šç§»é™¤ dev_login

```bash
# 6.1 ç‰©ç†åˆ é™¤ç«¯ç‚¹
# æ‰¾åˆ° src/routes/auth.ts ä¸­çš„ dev_login routeï¼Œåˆ é™¤æ•´ä¸ª block

# 6.2 æäº¤ä»£ç 
git add -A
git commit -m "Sprint 2: ç§»é™¤ dev_login åº”æ€¥é€šé“"

# 6.3 éƒ¨ç½²
docker compose build --no-cache mdm-api
docker compose up -d
```

### 12.7 å›žæ»šæ–¹æ¡ˆ

å¦‚æžœ Sprint 2 ä¸Šçº¿åŽå‡ºé—®é¢˜ï¼š

```bash
# ç«‹å³å›žæ»š
docker compose down mdm-api
# git revert <commit>
docker compose build mdm-api
docker compose up -d mdm-api

# æ¢å¤ dev_login
git revert <åˆ é™¤ dev_login çš„ commit>
# é‡æ–°éƒ¨ç½²

# æ•°æ®åº“å›žæ»šï¼ˆå¦‚æžœ migration æœ‰é—®é¢˜ï¼‰
docker exec mrdi-postgres pg_restore -U mrdi -d mrdi -n mdm --clean ./backups/mdm_backup_*.dump
```

---

## 13. HTML åŽŸåž‹è®¡åˆ’ï¼ˆSprint 2 æ¼”ç¤ºç”¨ï¼‰

> 4 ä¸ªæ ¸å¿ƒé¡µé¢ï¼ŒAwwwards çº§åˆ«è§†è§‰ï¼Œç›®æ ‡ï¼šJerry æ‹¿åŽ»æ¼”ç¤ºç»™å›¢é˜Ÿ / è€æ¿ã€‚

### 13.1 åŽŸåž‹èŒƒå›´

| é¡µé¢ | è·¯å¾„ | å…³é”®äº¤äº’ |
|------|------|----------|
| **Login** | `/login` | å¤§æŒ‰é’®"å…¬å¸è´¦å·ç™»å½•" + æŠ˜å "åº”æ€¥ç™»å½•" |
| **Welcome** | `/welcome` | é¦–æ¬¡ç™»å½•å¼•å¯¼ï¼ˆå¯†ç  + MFAï¼‰ |
| **MFA å¯ç”¨** | `/mfa-setup` | äºŒç»´ç  + éªŒè¯ç è¾“å…¥ |
| **Admin Users** | `/mdm/users` | åˆ—è¡¨ + è§£é”/é‡ç½®å¯†ç æŒ‰é’® |

### 13.2 è§†è§‰è§„èŒƒ

- **é£Žæ ¼**ï¼šB ç«¯ SaaS æžç®€ï¼ˆå‚è€ƒ Linear / Notion / Vercel Dashboardï¼‰
- **é…è‰²**ï¼šMRDI å“ç‰Œè‰² `#00B388`ï¼ˆCTAï¼‰+ Zinc ä¸­æ€§è‰²ï¼ˆéª¨æž¶ï¼‰
- **å­—ä½“**ï¼šç³»ç»Ÿå­—ä½“æ ˆï¼ˆ`-apple-system, "SF Pro Text"`, `Segoe UI`, Robotoï¼‰
- **åœ†è§’**ï¼š`rounded-xl` èµ·æ­¥
- **é˜´å½±**ï¼šå¤šå±‚æŸ”å’ŒæŠ•å½±
- **å›¾ç‰‡**ï¼šUnsplash å®žæ‹ï¼ˆä¸ç”¨å ä½å›¾ï¼‰

### 13.3 æŠ€æœ¯æ ˆ

- çº¯ HTML5 + Tailwind CDN + Vanilla JS
- å•é¡µ SPAï¼ˆé¡µé¢é—´ç”¨ hash è·¯ç”±æˆ–é”šç‚¹è·³è½¬ï¼‰
- æ‰€æœ‰æ–‡æ¡ˆä¸­æ–‡
- çœŸå®žå¯ç‚¹å‡»ï¼ˆå¸¦ hoverã€active çŠ¶æ€ï¼‰

### 13.4 æ–‡ä»¶è¾“å‡º

```
docs/Sprint2/prototype/
â”œâ”€â”€ index.html          # å…¥å£ï¼ˆ4 é¡µå¯åˆ‡æ¢ï¼‰
â”œâ”€â”€ login.html          # ç™»å½•é¡µ
â”œâ”€â”€ welcome.html        # é¦–æ¬¡ç™»å½•å¼•å¯¼
â”œâ”€â”€ mfa-setup.html      # MFA å¯ç”¨
â”œâ”€â”€ admin-users.html    # ç”¨æˆ·ç®¡ç†
â””â”€â”€ assets/
    â”œâ”€â”€ logo.svg        # MRDI logoï¼ˆå ä½ï¼‰
    â””â”€â”€ styles.css      # å¾®è°ƒæ ·å¼
```

### 13.5 æ¼”ç¤ºè„šæœ¬ï¼ˆJerry ç”¨ï¼‰

```
1. æ‰“å¼€ index.html â†’ é»˜è®¤æ˜¾ç¤º Login é¡µ
2. æ¼”ç¤º M365 æµç¨‹ï¼š
   - ç‚¹"å…¬å¸è´¦å·ç™»å½•"
   - æ¨¡æ‹Ÿè·³è½¬ M365ï¼ˆå¼¹çª—æ˜¾ç¤º fake Microsoft ç™»å½•é¡µï¼‰
   - å›žè·³åˆ° /welcomeï¼ˆé¦–æ¬¡ç™»å½•ï¼‰
3. æ¼”ç¤ºåº”æ€¥æµç¨‹ï¼š
   - è¿”å›ž Login é¡µ
   - ç‚¹"åº”æ€¥ç™»å½•"å±•å¼€
   - è¾“ username + å¯†ç  + TOTP
   - è·³è½¬ dashboard
4. æ¼”ç¤º MFA å¯ç”¨ï¼š
   - åœ¨ Welcome é¡µç‚¹"å¯ç”¨ MFA"
   - æ˜¾ç¤ºäºŒç»´ç  + éªŒè¯ç è¾“å…¥
   - æˆåŠŸ â†’ æç¤ºå®Œæˆ
5. æ¼”ç¤º admin è§£é”ï¼š
   - è·³åˆ° admin-users
   - æ‰¾ä¸€ä¸ª"å·²é”å®š"ç”¨æˆ·
   - ç‚¹"è§£é”" â†’ æˆåŠŸæç¤º
```

### 13.6 éªŒæ”¶

- [ ] 4 ä¸ªé¡µé¢éƒ½èƒ½åœ¨ Chrome 100+ æ­£å¸¸æ‰“å¼€
- [ ] æ‰€æœ‰æŒ‰é’®å¯ç‚¹å‡»ã€æœ‰ hover/active åé¦ˆ
- [ ] ä¸­æ–‡æ–‡æ¡ˆæ— è‹±æ–‡æ®‹ç•™
- [ ] é…è‰²ä¸Žå“ç‰Œè‰²ä¸€è‡´ï¼ˆ#00B388ï¼‰
- [ ] ç§»åŠ¨ç«¯å¯è¯»ï¼ˆå“åº”å¼åŸºç¡€ï¼‰
- [ ] ç¦»çº¿å¯é¢„è§ˆï¼ˆCDN èµ„æºæœ¬åœ°åŒ–ï¼‰

---

## é™„å½• Aï¼šæœ¯è¯­è¡¨

| æœ¯è¯­ | è§£é‡Š |
|------|------|
| AuthN | Authenticationï¼ŒéªŒè¯"ä½ æ˜¯è°" |
| AuthZ | Authorizationï¼Œå†³å®š"ä½ èƒ½åšä»€ä¹ˆ" |
| TOTP | Time-based One-Time Passwordï¼Œ6 ä½ 30s éªŒè¯ç  |
| MFA | Multi-Factor Authenticationï¼Œå¤šå› ç´ è®¤è¯ |
| IdP | Identity Providerï¼Œèº«ä»½æä¾›æ–¹ï¼ˆM365 å³ IdPï¼‰ |
| OAuth 2.0 | æŽˆæƒæ¡†æž¶ï¼ŒM365 ç™»å½•ç”¨çš„åè®® |
| OpenID Connect | åŸºäºŽ OAuth 2.0 çš„èº«ä»½éªŒè¯åè®® |
| JWT | JSON Web Tokenï¼Œç™»å½•æ€ |
| bcrypt | å¯†ç å“ˆå¸Œç®—æ³•ï¼ˆä¸å¯é€†ï¼‰ |

## é™„å½• Bï¼šM365 OAuth é…ç½®æ¸…å•

éœ€è¦åœ¨ Azure Portal é…ç½®ï¼š
- Tenant ID
- App Registration
- Client ID
- Client Secretï¼ˆç”¨ env var æ³¨å…¥ï¼‰
- Redirect URI: `http://localhost:8089/auth/m365/callback`
- API Permissions: openid, profile, email, User.Read
- Token configuration: id_token

**æ³¨**ï¼šM365 å·²ç»åœ¨ MRDI ä½¿ç”¨ï¼Œé…ç½®åº”å·²å°±ç»ªã€‚Sprint 2 ä»…éœ€ç¡®è®¤å¹¶å¯¹æŽ¥ã€‚

---

*æœ€åŽæ›´æ–°ï¼š2026-07-16 Â· çŠ¶æ€ï¼šè‰æ¡ˆ v1.0*
*ä¸‹æ¬¡æ›´æ–°ï¼šSprint 2 kickoff åŽ*



## 14. Sprint 2 交付清单总览

### 14.1 代码交付

| 模块 | 路径 | 说明 |
|------|------|------|
| Prisma schema | mdm-api/prisma/schema.prisma | §5.1 patch |
| Migration | mdm-api/prisma/migrations/20260716_sprint2_auth_hybrid/ | 自动生成 |
| Auth 路由 | mdm-api/src/routes/auth/ | 11 个 endpoint 重构 |
| 应急登录 | mdm-api/src/routes/auth/login.ts | 新建 |
| M365 callback | mdm-api/src/routes/auth/m365.ts | 新建 |
| MFA | mdm-api/src/routes/auth/mfa.ts | 新建 |
| 密码管理 | mdm-api/src/routes/auth/password.ts | 新建 |
| 通知脚本 | mdm-api/scripts/notify-users-to-reset-password.ts | §12.3.2 |
| 前端 Login | mrdi-portal/src/pages/Login.tsx | 改造 |
| 前端 Welcome | mrdi-portal/src/pages/Welcome.tsx | 新建 |
| 前端 MFA 设置 | mrdi-portal/src/pages/MfaSetup.tsx | 新建 |

### 14.2 文档交付

| 文档 | 路径 | 受众 |
|------|------|------|
| 本 PRD | docs/Sprint2/AUTH_HYBRID_PRD.md | 业务 + 开发 |
| API 详细规范 | （本 PRD §6） | 后端开发 |
| Prisma diff | （本 PRD §5.1） | 后端开发 |
| 数据库迁移清单 | （本 PRD §12） | 运维 + DBA |
| HTML 原型 | docs/Sprint2/prototype/ | 演示 + 前端开发 |
| Sprint 1 PRD 差异 | docs/Sprint2/DELTA_FROM_V1.md | 业务 review |

### 14.3 验证清单（实施完成后逐项勾选）

**后端验证**
- [ ] pnpm exec prisma migrate dev 成功
- [ ] User 表新增 13 个字段
- [ ] LoginAudit 表存在
- [ ] POST /auth/v1/login 应急登录成功（dev 模式）
- [ ] POST /auth/v1/m365/callback 流程跑通（dev MOCK）
- [ ] POST /auth/v1/change-password 改密成功
- [ ] 5 次密码错误 → 账号锁定 30 分钟
- [ ] TOTP 启用 + 验证 + 关闭 全流程
- [ ] GET /auth/v1/me 返回 mfa_enabled 字段
- [ ] LoginAudit 表有登录记录

**前端验证**
- [ ] Login 页有"公司账号登录"主按钮 + 折叠"应急登录"
- [ ] M365 失败 2 次后自动展开应急
- [ ] Welcome 页首次登录跳转
- [ ] MFA 设置页能扫二维码
- [ ] 改密流程通
- [ ] 密码过期前 7 天提示改密

**运维验证**
- [ ] 备份脚本能跑
- [ ] Migration 脚本能跑
- [ ] 7 天过渡期 dev_login 还在
- [ ] 回滚演练通过（至少在 dev 环境）

### 14.4 Sprint 2 验收 Demo

`
1. 打开 portal → Login 页
   - 演示 M365 流程（dev MOCK）
   - 演示应急登录

2. 打开 prisma studio → User 表
   - 看新加的 13 个字段
   - 看 LoginAudit 表的数据

3. 跑测试：
   - 5 次错误密码 → 看锁定
   - TOTP 启用 → 看 mfaEnabled 字段变 true
   - 改密 → 看 passwordHash bcrypt 串

4. 演示 admin 功能：
   - admin 解锁一个被锁用户
   - admin 临时重置密码 → 用户被强制改密
`

### 14.5 Sprint 2 收尾 checklist

- [ ] 所有验证清单 ✅
- [ ] Demo 演示通过
- [ ] 旧 dev_login 7 天过渡期满 → 移除
- [ ] M365 真实租户配置完成（替换 dev MOCK）
- [ ] 邮件 SMTP 接入（占位 console.log 替换）
- [ ] Sprint 2 收尾 review 文档（docs/Sprint2/REVIEW.md）
- [ ] 更新根 VERSION.md 到 v1.1

---

最后更新：2026-07-17 · 状态：v1.1 实施就绪