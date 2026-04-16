# VLR.gg API - Setup Guide for Rakshaa

## First Time Setup (Clone)

You only clone ONCE when you don't have the project on your computer yet.

```bash
git clone https://github.com/shreshth-s/vlr-api.git
cd vlr-api
npm install
```

## Running the Project

```bash
npm run dev
```

This starts the dev server. The API will be available at `http://localhost:3000` (or whatever port is configured).

## Git Workflow Scenarios

### Scenario 1: You want to make changes and push them

```bash
# 1. First, get the latest changes (always do this before starting work)
git pull

# 2. Make your code changes...

# 3. See what files you changed
git status

# 4. Add your changes
git add .

# 5. Commit with a message
git commit -m "Description of what you changed"

# 6. Push to GitHub
git push
```

### Scenario 2: Shreshth made changes and you want to get them

```bash
git pull
```

That's it. This downloads and merges his changes into your local copy.

### Scenario 3: You get an error when pushing (someone else pushed first)

```bash
# Pull the latest changes first
git pull

# If there are no conflicts, just push again
git push

# If there ARE conflicts, git will tell you which files have conflicts
# Open those files, look for <<<<<<< and >>>>>>> markers
# Fix the conflicts, then:
git add .
git commit -m "Resolved merge conflicts"
git push
```

### Scenario 4: You want to undo changes you haven't committed yet

```bash
# Undo changes to a specific file
git checkout -- filename.ts

# Undo ALL uncommitted changes (be careful!)
git checkout -- .
```

### Scenario 5: You want to see what changed

```bash
# See uncommitted changes
git diff

# See commit history
git log --oneline

# See what Shreshth changed in his commits
git log --oneline --author="shreshth"
```

## Quick Reference

| What you want to do | Command |
|---------------------|---------|
| Get the project (first time) | `git clone <url>` |
| Get latest changes | `git pull` |
| See what you changed | `git status` |
| Save your changes | `git add .` then `git commit -m "message"` |
| Upload to GitHub | `git push` |
| Run the project | `npm run dev` |
| Install dependencies | `npm install` |

## Project Structure

```
src/
├── index.ts           # Main entry point
├── config/            # Configuration
├── routes/            # API endpoints (matches, events, players, teams)
├── scrapers/          # Web scrapers for vlr.gg
├── lib/               # Utilities (cache, debug, scraper helpers)
└── types/             # TypeScript types
```

## Common Issues

**"npm not found"** - Install Node.js from https://nodejs.org

**"Permission denied" when pushing** - Ask Shreshth to add you as a collaborator on the repo

**"Your branch is behind"** - Run `git pull` first, then try pushing again

## Need Help?

Ask Shreshth or Google the error message - Stack Overflow usually has the answer!
