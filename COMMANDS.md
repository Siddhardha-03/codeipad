# DSA Canvas Visualizer - Command Reference Guide

## Quick Command Reference

### Essential Commands

```bash
# Navigate to project
cd "d:\Black box\projects"

# Install dependencies (FIRST TIME ONLY)
npm install

# Start development server
npm start

# Build for production
npm build

# Stop the server
# Ctrl + C in terminal
```

---

## Installation & Setup Commands

### Initial Setup

```bash
# 1. Navigate to project folder
cd "d:\Black box\projects"

# 2. Install all dependencies (only needed once)
npm install

# 3. Start the application
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view dsa-canvas-visualizer in the browser.

  http://localhost:3000
```

---

## Development Commands

### Start Development Server

```bash
npm start
```
- Starts on port 3000
- Auto-reloads on file changes
- Opens browser automatically
- Shows errors in terminal

### Start on Different Port

```bash
npm start -- --port 3001
```
Use if port 3000 is already in use

### Build for Production

```bash
npm build
```
- Creates optimized production build
- Outputs to `build/` folder
- Minifies code
- Optimizes assets

### Run Tests

```bash
npm test
```
Runs test suite (if tests are created)

---

## Troubleshooting Commands

### Clear npm Cache

```bash
npm cache clean --force
```
Use if experiencing package issues

### Reinstall Dependencies

```bash
# Option 1: Remove node_modules and reinstall
rm -r node_modules package-lock.json
npm install

# Option 2: Using PowerShell (Windows)
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Check Node & npm Versions

```bash
node --version
npm --version
```
Should show v14+ for Node and v6+ for npm

### List Installed Packages

```bash
npm list
```
Shows dependency tree

### Update npm

```bash
npm install -g npm@latest
```
Updates npm to latest version

---

## Project-Specific Commands

### View Available Scripts

```bash
npm run
```
Lists all available npm scripts

### Start in Development Mode

```bash
npm run start
```
Same as `npm start`

### Eject Configuration (NOT RECOMMENDED)

```bash
npm eject
```
⚠️ WARNING: This is permanent and cannot be undone
Only use if you need full control over configuration

---

## Windows-Specific Commands

### Open Command Prompt

```
Windows Key + R
type: cmd
press Enter
```

### Navigate to Folder

```bash
cd d:\Black box\projects
```

### List Directory Contents

```bash
dir
```

### Clear Screen

```bash
cls
```

### Check if Port is in Use

```bash
netstat -ano | findstr :3000
```

### Kill Process on Port 3000

```bash
# First, find the PID with:
netstat -ano | findstr :3000

# Then kill it (replace XXXX with PID):
taskkill /PID XXXX /F
```

---

## PowerShell Equivalents

### Navigate Directory
```powershell
cd "d:\Black box\projects"
```

### List Contents
```powershell
Get-ChildItem
# or shorter:
ls
```

### Clear Screen
```powershell
Clear-Host
# or:
cls
```

### Check Node
```powershell
node -v
npm -v
```

---

## Creating React App (Reference)

If you were starting from scratch:

```bash
# Create new React app
npx create-react-app dsa-canvas-visualizer

# Navigate into project
cd dsa-canvas-visualizer

# Install Konva packages
npm install konva react-konva

# Start development
npm start
```

---

## Git Commands (If Using Version Control)

### Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit - DSA Canvas Visualizer"
```

### Check Status

```bash
git status
```

### View Changes

```bash
git diff
```

### Commit Changes

```bash
git commit -m "Your message here"
```

### Push to Remote

```bash
git push origin main
```

---

## Deployment Commands

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm build
# Then drag 'build' folder to Netlify web interface
```

### Deploy to GitHub Pages

```bash
npm install --save-dev gh-pages

# Add to package.json:
# "homepage": "https://yourusername.github.io/dsa-visualizer",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

npm run deploy
```

---

## Environment Commands

### Set Environment Variables (Windows Command Prompt)

```bash
set NODE_OPTIONS=--max_old_space_size=4096
npm start
```

### Set Environment Variables (PowerShell)

```powershell
$env:NODE_OPTIONS="--max_old_space_size=4096"
npm start
```

### Create .env File

```bash
# Create a .env file in project root with:
REACT_APP_API_URL=http://localhost:8000
REACT_APP_DEBUG=true
```

---

## File System Commands

### Create Directory

```bash
# Windows
mkdir src\components\modals

# PowerShell
New-Item -ItemType Directory -Path "src/components/modals"
```

### Create File

```bash
# Windows
type nul > filename.jsx

# PowerShell
New-Item -ItemType File -Path "filename.jsx"
```

### Copy File

```bash
# Windows
copy source.jsx destination.jsx

# PowerShell
Copy-Item source.jsx destination.jsx
```

### Delete File

```bash
# Windows
del filename.jsx

# PowerShell
Remove-Item filename.jsx
```

---

## Useful npm Global Packages

### Install Global Packages

```bash
# Prettier (code formatter)
npm install -g prettier

# ESLint (code linter)
npm install -g eslint

# Serve (production server)
npm install -g serve

# Vercel CLI
npm install -g vercel

# GitHub CLI
npm install -g gh
```

### Test Production Build Locally

```bash
npm build
npm install -g serve
serve -s build
```

---

## Performance & Optimization

### Analyze Bundle Size

```bash
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

### Monitor Performance

```bash
# Chrome DevTools shortcut: F12
# Then: Performance tab → Record → Refresh → Stop
```

---

## Documentation Viewing

### Open Documentation Files

```bash
# Windows - Open with default app
START START_HERE.md

# Or use VS Code
code START_HERE.md

# Or use Notepad
notepad START_HERE.md
```

### View in Terminal

```bash
# Windows Command Prompt
more INSTALLATION.md

# PowerShell
Get-Content INSTALLATION.md | more
```

---

## Useful Keyboard Shortcuts

### In Terminal
| Shortcut | Action |
|----------|--------|
| Ctrl+C | Stop running process |
| Ctrl+L | Clear screen |
| Arrow Up | Previous command |
| Arrow Down | Next command |
| Tab | Auto-complete |

### In Browser (F12 DevTools)
| Shortcut | Action |
|----------|--------|
| F12 | Open DevTools |
| Ctrl+Shift+J | Open Console |
| Ctrl+Shift+I | Open Inspector |
| Ctrl+Shift+C | Element picker |
| Ctrl+Shift+E | Network tab |

### In VS Code
| Shortcut | Action |
|----------|--------|
| Ctrl+` | Open terminal |
| Ctrl+Shift+P | Command palette |
| Ctrl+/ | Toggle comment |
| Alt+Shift+F | Format document |
| Ctrl+S | Save file |

---

## Debugging Commands

### Debug Mode (Node.js)

```bash
node --inspect-brk src/App.jsx
```

### View Network Requests

```bash
# In browser DevTools: F12 → Network tab
# Then reload page to see requests
```

### Check Console Logs

```bash
# In browser DevTools: F12 → Console tab
# Check for errors (red) and warnings (yellow)
```

---

## Quick Problem Solvers

### Issue: Can't start app

```bash
# Solution 1: Clear cache and reinstall
npm cache clean --force
npm install
npm start

# Solution 2: Kill process and retry
Ctrl+C
npm start
```

### Issue: Module not found

```bash
# Solution: Reinstall dependencies
npm install

# Or reinstall specific package:
npm install react
```

### Issue: Port already in use

```bash
# Solution: Use different port
npm start -- --port 3001
```

### Issue: App running slowly

```bash
# Solution: Increase Node heap
set NODE_OPTIONS=--max_old_space_size=8192
npm start
```

---

## Command Chaining

### Run Multiple Commands

```bash
# Windows (use &)
npm cache clean --force & npm install & npm start

# PowerShell (use ;)
npm cache clean --force; npm install; npm start

# On any system (use &&)
npm cache clean --force && npm install && npm start
```

---

## Batch/Script Files (Windows)

### Create start.bat

```batch
@echo off
cd "d:\Black box\projects"
npm start
```

Save as `start.bat`, then double-click to run

### Create setup.bat

```batch
@echo off
cd "d:\Black box\projects"
npm install
npm start
```

---

## Terminal Tips

### Make Commands Easier to Remember

```bash
# Add to your command history
npm start                    # Ctrl+C to stop
# Wait for it to finish

# Or set up aliases in PowerShell
# Add this to PowerShell profile:
# Set-Alias -Name vsc -Value code
# Set-Alias -Name startapp -Value npm start
```

### View Command History

```bash
# In Windows Command Prompt
doskey /history

# In PowerShell
Get-History
```

---

## Emergency Commands

### Force Stop Everything

```bash
# Ctrl+C in terminal
# If that doesn't work:
Ctrl+Shift+Esc  # Open Task Manager
# Find node.exe, click, End Task

# Or use command:
taskkill /F /IM node.exe
```

### Reset Everything

```bash
# Nuclear option - clean reinstall
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
npm start
```

---

## Reference Quick Links

| Task | Command |
|------|---------|
| Start | `npm start` |
| Install | `npm install` |
| Build | `npm build` |
| Stop | `Ctrl+C` |
| Check version | `node -v` |
| Port 3001 | `npm start -- --port 3001` |
| Clear cache | `npm cache clean --force` |
| Reinstall | `npm install` |

---

## Still Stuck?

1. Read **INSTALLATION.md** for detailed setup
2. Check **START_HERE.md** for overview
3. Review **QUICKSTART.md** for quick reference
4. Open browser DevTools: F12
5. Check terminal for error messages

---

**Common Commands Summary:**

```bash
cd "d:\Black box\projects"    # Go to project
npm install                   # Install once
npm start                     # Every time you want to code
npm build                     # When deploying
Ctrl+C                       # Stop the server
```

That's it! You're ready to develop! 🚀
