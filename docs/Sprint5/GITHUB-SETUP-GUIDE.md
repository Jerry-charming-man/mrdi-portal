# MRDI Portal · GitHub 初始化操作手册

> **适用场景**：全新 GitHub 账号 · zero repos
> **目标**：建 repo → push 代码 → 配 Actions secrets
> **预计时间**：10 分钟

---

## Step 0 · 确认本机 git 状态

打开 PowerShell 验证：

```powershell
cd C:/M0056/20-AI/40-Minimax/Portal
git log --oneline -1
```

**预期输出**（不是这个就说明不在 Portal 目录）：
```
e5b11bd feat: Sprint 5 CI/CD — initial commit
```

如果显示 `fatal: not a git repository`，先运行：
```powershell
git init --initial-branch=main
git add .
git commit -m "feat: Sprint 5 CI/CD — initial commit"
```

---

## Step 1 · 建 GitHub Repo（约 2 分钟）

### 1.1 点击 "Create repository"

在 GitHub 主页点 **"Create repository"** 绿色按钮（左侧栏）。

### 1.2 填写表单

| 字段 | 填什么 |
|------|--------|
| **Repository template** | No template |
| **Owner** | 你的 username（自动填好）|
| **Repository name** | `mrdi-portal` |
| **Description** | `MRDI Fab IT Portal — 5 API monorepo: MDM / CIM-RMS / CIM-IMS / CIM-PERM + React SPA` |
| **Visibility** | ✅ **Private**（选 Private）|
| ☑️ Add a README file | **不要勾**（已有）|
| ☑️ Add .gitignore | **不要勾**（已有）|
| ☑️ Choose a license | **不要勾**（本项目不开源）|

然后点 **"Create repository"**。

### 1.3 复制远程地址

建好后会跳到空 repo 页面，找到：

```
…or push an existing repository from the command line
```

下面有两行命令，记下来：
```
git remote add origin https://github.com/<你的username>/mrdi-portal.git
git push -u origin main
```

---

## Step 2 · 本机关联 Remote（约 1 分钟）

回到 PowerShell：

```powershell
cd C:/M0056/20-AI/40-Minimax/Portal

# 替换 <你的username> 为你 GitHub 的实际 username
git remote add origin https://github.com/<你的username>/mrdi-portal.git
git branch -M main
git push -u origin main
```

第一次 push 会弹出 GitHub 登录窗口，按提示授权即可。

**验证**：刷新 GitHub repo 页面，应该能看到 578 个文件了。

---

## Step 3 · 配 GitHub Variables（约 2 分钟）

### 3.1 进 Settings

在 repo 页面点 **Settings**（顶部菜单栏）。

### 3.2 配 Repository Variables

左侧菜单 → **Variables and secrets** → **Actions** → 点 **"New repository variable"**

| Name | Value | 说明 |
|------|-------|------|
| `VM_HOST` | `vm-jerry-dev-01` | VM 的公网域名（如 xxx.eastasia.cloudapp.azure.com，等 VM 配置好再填真实值）|

> 现在先填 `vm-jerry-dev-01` 占位，等 CD 上线时替换成真实域名。

点 **"Add variable"**。

### 3.3 配 Repository Secrets

同页面 → **"New repository secret"**

| Name | Value | 说明 |
|------|-------|------|
| `MRDI_WEBHOOK_SECRET` | `mrdi-webhook-secret-2026` | 任意随机字符串（可以改，但 VM 端要一致）|

> 建议用 PowerShell 生成随机字符串：
> ```powershell
> -join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
> ```

点 **"Add secret"**。

---

## Step 4 · 验证 GitHub Actions（约 1 分钟）

### 4.1 刷新 repo 主页

GitHub Actions 会**自动开始运行**（因为 push 触发了 `ci.yml`）。

### 4.2 看 Actions 日志

顶部菜单 → **Actions** → 点第一个 workflow run

应该看到：
```
✓ TypeScript Check — Passed
✓ Build Docker Images — mdm-api — Passed
✓ Build Docker Images — cimrms-api — Passed
✓ Build Docker Images — cimims-api — Passed
✓ Build Docker Images — cim-perm-api — Passed
✓ Build Docker Images — mrdi-portal — Passed
```

> 如果有红色 ❌，截图给我，我来分析。

---

## Step 5 · 验证 ghcr.io 镜像（约 1 分钟）

Actions 跑完后，进 GitHub repo → **Packages** 页面，应该看到 5 个镜像：

```
ghcr.io/<你的username>/mrdi/mdm-api
ghcr.io/<你的username>/mrdi/cimrms-api
ghcr.io/<你的username>/mrdi/cimims-api
ghcr.io/<你的username>/mrdi/cim-perm-api
ghcr.io/<你的username>/mrdi/mrdi-portal
```

> 如果 Packages 页面打不开，在 Actions 日志里搜索 `ghcr.io` 确认 push 成功了就行。

---

## ⚠️ 常见问题

### Q: push 时要登录 GitHub，一直弹窗
**解决**：用 Personal Access Token（PAT）代替。
1. GitHub 右上角头像 → **Settings** → 左侧 **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**
2. 勾选 `repo` 权限
3. 生成后复制 token
4. push 时 username 填 GitHub username，password 填 token（不是密码）

### Q: Actions 一直排队不跑
**原因**：免费账号 Actions 有排队时间，等 1-2 分钟自动开始。

### Q: Docker build 失败，OOM
**原因**：Actions runner 内存不够。修改 `ci.yml`，给对应 job 加：
```yaml
runs-on: ubuntu-latest-4-cores
```

### Q: 我想把镜像名从 `mrdi/` 改成其他前缀
改 `ci.yml` 里 `env.IMAGE_PREFIX` 和 `cd.yml` 里的 `ghcr.io` URL，然后 commit + push。

---

## 下一步（等 VM 准备好再做）

| 步骤 | 做什么 |
|------|--------|
| 1 | VM 端安装 `webhook-receiver.py` + 注册 systemd service |
| 2 | Azure NSG 开放 9000 端口 |
| 3 | `VM_HOST` 变量替换成真实公网域名 |
| 4 | 用 `workflow_dispatch` 手动触发一次 CD 验证端到端 |

---

*手册版本：v1.0 · 2026-07-22 · Mavis*
