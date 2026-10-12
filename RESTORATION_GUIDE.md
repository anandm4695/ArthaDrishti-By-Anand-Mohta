# 🔄 ArthaDrishti by Anand Mohta - System Reset & Restoration Guide

This document contains everything needed to restore the project environment after a system reset.

---

## 1. Pre-Reset Summary
- **Repository**: Synced with GitHub (`origin/main`)
- **Node.js Target**: `v24.x` (or `v20+ LTS`)
- **Package Manager**: `npm`
- **Database/Backend**: Supabase
- **Environment Backup**: Saved in `.env.backup` (included in this project folder)

---

## 2. Post-Reset Steps

### Step A: Prerequisites on your fresh Mac
1. Install **Xcode Command Line Tools** (in Terminal):
   ```bash
   xcode-select --install
   ```
2. Install **Node.js** (v20+ or v24+) from [nodejs.org](https://nodejs.org).
3. Install **Antigravity IDE**.

### Step B: Launch and Restore
1. Copy the `Personal Finance by Anand Mohta` folder back to your Mac (or clone it).
2. Open this folder in Antigravity IDE.
3. In the chat, simply type **"Restore"**!
   - I (Antigravity) will automatically run `./restore.sh`, restore `.env`, install dependencies, run TypeScript verification, test the production build, and start the development server.
4. Alternatively, you can run `./restore.sh` directly in your terminal at any time.

---

## 3. Key Commands Reference
- Run automated restore: `./restore.sh`
- Start development server: `npm run dev`
- Run TypeScript checks: `npx tsc --noEmit`
- Run test suite: `npm test`
- Build for production: `npm run build`
