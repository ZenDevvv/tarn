---
name: yeet
description: Enforces branch isolation during planning and implementation, and safely commits, pushes, PRs, and rebase-merges finished, conflict-free tasks into main without redundant test reruns.
---

# Yeet Protocol

The `yeet` workflow provides two mutually exclusive operational modes depending on whether work is starting or finishing.

---

## Mode 1: Task Initiation & Branch Prep (When Starting / Planning)

**Condition**: Invoked before work begins, when drafting a `plan.md`, or before implementing changes.

### Directives:
1. **Check Branch State**:
   ```bash
   git branch --show-current
   ```
2. **Branch Isolation**:
   - If currently on `main`:
     - Derive a concise conventional slug based on the task (e.g. `feat/<slug>`, `fix/<slug>`).
     - Create and switch to the new branch:
       ```bash
       git checkout -b <branch-name>
       ```
   - If already on a feature branch (not `main`):
     - Retain the current branch.
3. 🛑 **MANDATORY HARD STOP**:
   - **DO NOT** commit, push, create a PR, or merge.
   - Report the active branch to the user and hand over to planning/implementation.

---

## Mode 2: Task Finalization & Ship Pipeline (When Work is Done)

**Condition**: Invoked when the task implementation is complete and ready to land.

### Directives:
1. **Commit Remaining Changes** (Skip redundant test verification):
   - Do NOT re-run test suites (already validated during implementation).
   - Check status and commit any uncommitted changes:
     ```bash
     git status --short
     git add <changed-files>
     git commit -m "<type>(<scope>): <summary>"
     ```

2. **Upstream Conflict Verification**:
   - Fetch latest `main` and test rebase for conflicts:
     ```bash
     git fetch origin main
     git rebase origin/main
     ```
   - **Conflict Gate**:
     - If conflicts occur: **HALT IMMEDIATELY**. Run `git rebase --abort`, display the list of conflicting files, and do not create a PR or merge.
     - If rebase succeeds with zero conflicts: proceed to step 3.

3. **Push & PR**:
   - Push feature branch upstream:
     ```bash
     git push -u origin <branch-name>
     ```
   - Create Pull Request via GitHub CLI:
     ```bash
     gh pr create --title "<type>(<scope>): <summary>" --body "### Summary\n<description>\n\n### Conflict Status\n- Rebased cleanly against main with zero conflicts"
     ```

4. **Rebase & Merge**:
   - Execute merge with branch cleanup:
     ```bash
     gh pr merge --rebase --delete-branch
     ```

5. **Local Sync**:
   - Switch back to `main` and sync latest state:
     ```bash
     git checkout main
     git pull origin main
     ```
