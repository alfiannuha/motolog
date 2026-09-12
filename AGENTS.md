<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

### CRITICAL PROTOCOL: PRE-PUSH QUALITY GATE & AUTOMATIC GITHUB SYNC

Every task assigned to you MUST strictly conclude with our **Verification & Git Push Workflow**. You are not allowed to mark a task as finished without passing local verification and pushing clean code to the target repository.

Target Remote: `https://github.com/alfiannuha/motolog.git`
Target Branch: `main` (or active working branch)

#### Step 1: Mandatory Zero-Error Quality Gate (Pre-Commit Checks)
Before staging or committing any code, execute and verify:
1. **TypeScript Check:** `npx tsc --noEmit` (Must pass with 0 errors).
2. **Linting Check:** `npm run lint` (Resolve all warnings/errors).
3. **Build Check:** `npm run build` (Must produce successful standalone/production build).
4. **Secrets Guard:** Ensure `.env*` and sensitive service role keys are excluded via `.gitignore`.

#### Step 2: Automated Git Commit & Push Routine
Once checks pass 100%:
1. Check status: `git status`
2. Stage files: `git add .`
3. Commit with conventional message: `git commit -m "feat/fix: <description>"`
4. Push to remote: `git push https://github.com/alfiannuha/motolog.git HEAD`
5. Report final deployment/sync status.
