#!/usr/bin/env bash
# One-Click Vibe Coding Stack Setup Script (Bash / macOS / Linux / WSL)
# Installs & Configures: Ponytail, Graphify, and Addy Osmani's Agent Skills.

set -e

DESIGN_PROFILE="motion"
DRY_RUN=false
KEEP_ORIGIN=false
while (($#)); do
    case "$1" in
        --design-profile)
            [[ -n "${2:-}" ]] || { echo "Missing value for --design-profile" >&2; exit 2; }
            DESIGN_PROFILE="$2"
            shift 2
            ;;
        --dry-run) DRY_RUN=true; shift ;;
        --keep-origin) KEEP_ORIGIN=true; shift ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

case "$DESIGN_PROFILE" in
    motion|frontend|minimal|custom) ;;
    *) echo "Invalid design profile: $DESIGN_PROFILE" >&2; exit 2 ;;
esac

if [[ -t 0 && -z "${CI:-}" && "$DRY_RUN" == false && "$DESIGN_PROFILE" == "motion" ]]; then
    echo "Design profile (default: motion):"
    echo "  [1] motion   - Taste + Emil motion/mobile + Impeccable (recommended)"
    echo "  [2] frontend - Taste + Impeccable"
    echo "  [3] minimal  - Impeccable only"
    echo "  [4] custom   - Choose each design skill"
    read -r -p "Choose 1-4, or press Enter for motion: " choice
    case "$choice" in
        2) DESIGN_PROFILE="frontend" ;;
        3) DESIGN_PROFILE="minimal" ;;
        4) DESIGN_PROFILE="custom" ;;
    esac
fi

INSTALL_IMPECCABLE=true
INSTALL_TASTE=false
INSTALL_EMIL=false
[[ "$DESIGN_PROFILE" == "motion" || "$DESIGN_PROFILE" == "frontend" ]] && INSTALL_TASTE=true
[[ "$DESIGN_PROFILE" == "motion" ]] && INSTALL_EMIL=true
if [[ "$DESIGN_PROFILE" == "custom" && "$DRY_RUN" == false ]]; then
    read -r -p "Install Impeccable quality checks? [Y/n] " answer
    [[ "$answer" =~ ^(n|no)$ ]] && INSTALL_IMPECCABLE=false
    read -r -p "Install Taste Skill visual direction? [y/N] " answer
    [[ "$answer" =~ ^(y|yes)$ ]] && INSTALL_TASTE=true
    read -r -p "Install Emil motion/mobile skills? [y/N] " answer
    [[ "$answer" =~ ^(y|yes)$ ]] && INSTALL_EMIL=true
fi

if [[ "$DRY_RUN" == true ]]; then
    echo "Dry run: no installation, Git, or commit actions will be performed."
    echo "Design profile: $DESIGN_PROFILE"
    echo "  Impeccable: $INSTALL_IMPECCABLE"
    echo "  Taste Skill: $INSTALL_TASTE"
    echo "  Emil motion/mobile: $INSTALL_EMIL"
    exit 0
fi
# Ensure script executes in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(basename "$SCRIPT_DIR")" == ".template" ]]; then
    cd "$SCRIPT_DIR/.."
fi

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;36m   🚀 Initializing Vibe Coding Supercharged Template      \033[0m"
echo -e "\033[1;36m      Stack: Ponytail + Graphify + Agent Skills           \033[0m"
echo -e "\033[1;36m==========================================================\033[0m\n"

# 1. Check Python & Graphify
echo -e "\033[1;33m1️⃣ Checking Python & Graphify...\033[0m"
if command -v python3 &>/dev/null; then
    echo "Found Python: $(python3 --version)"
    if pip3 install --quiet --upgrade graphifyy || pip install --quiet --upgrade graphifyy; then
        if python3 -m graphify install 2>/dev/null || graphify install 2>/dev/null; then
            echo "   Graphify installed."
        else
            echo "   Graphify package installed, but skill registration failed." >&2
        fi
    else
        echo "   Graphify installation failed; continuing without it." >&2
    fi
else
    echo -e "\033[1;31m   ⚠️ python3 not found. Please install Python 3.10+.\033[0m"
fi

# 2. Check Git, Detach from Template, & Commit Hook
echo -e "\n\033[1;33m2️⃣ Checking Git Repository...\033[0m"
origin_url=$(git remote get-url origin 2>/dev/null || echo "")

if [[ "$origin_url" == *"model-agnostic-agent-template"* && "$KEEP_ORIGIN" == false ]]; then
    echo -e "\033[1;33m   🔄 Detected clone of template repository ($origin_url).\033[0m"
    echo -e "\033[1;36m   Disconnecting from template and initializing fresh Git repository for your project...\033[0m"
    rm -rf .git
    (git init -b main >/dev/null 2>&1 || git init >/dev/null 2>&1)
    echo -e "\033[1;32m   ✅ Initialized fresh, detached Git repository (main).\033[0m"
elif [ ! -d ".git" ]; then
    echo -e "\033[1;36m   Initializing fresh Git repository for your project...\033[0m"
    (git init -b main >/dev/null 2>&1 || git init >/dev/null 2>&1)
    echo -e "\033[1;32m   ✅ Initialized fresh Git repository (main).\033[0m"
fi

if [ -d ".git" ]; then
    if python3 -m graphify hook install 2>/dev/null || graphify hook install 2>/dev/null; then
        echo "   Installed Graphify post-commit hook."
    else
        echo "   Graphify hook installation failed; continuing." >&2
    fi
fi

# 3. Engineering & Design Skills
echo -e "\n\033[1;33m3️⃣ Installing Engineering & Design Skills...\033[0m"
AGY_AVAILABLE=false
if command -v agy &>/dev/null; then
    AGY_AVAILABLE=true
fi
if command -v npx &>/dev/null; then
    export CI=true

    if [[ "$AGY_AVAILABLE" == true ]]; then
        echo "   Addy Agent Skills deferred to the Antigravity plugin (avoids duplicate installation)."
    else
        echo "   Installing Addy Osmani's Agent Skills..."
        if npx --yes skills add addyosmani/agent-skills --all; then
            echo "   Agent Skills installed."
        else
            echo "   Agent Skills installation failed; continuing." >&2
        fi
    fi

    if [[ "$INSTALL_TASTE" == true ]]; then
        echo "   Installing Taste Skill (visual direction)..."
        if ! npx --yes skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"; then
            echo "   Taste Skill installation failed; continuing." >&2
        fi
    fi

    if [[ "$INSTALL_EMIL" == true ]]; then
        echo "   Installing Emil Kowalski's Motion & Mobile Native Skills..."
        if ! npx --yes skills@latest add emilkowalski/skills --skill "animate" --skill "mobile-native" --skill "review-animations"; then
            echo "   Emil Skills installation failed; continuing." >&2
        fi
    fi

    if [[ "$INSTALL_IMPECCABLE" == true ]]; then
        echo "   Installing Impeccable (design guidance & quality rules)..."
        if ! npx --yes impeccable install --yes --scope=project; then
            echo "   Impeccable installation failed; continuing." >&2
        fi
    fi

    unset CI
    echo "   Skill installation phase complete; review any warnings above."
else
    echo -e "\033[1;31m   ⚠️ npx not found. Please install Node.js 18+.\033[0m"
fi

# 4. Agent Environments
echo -e "\n\033[1;33m4️⃣ Checking Agent Environments...\033[0m"
if [[ "$AGY_AVAILABLE" == true ]]; then
    echo "   Found Antigravity CLI (agy)! Installing plugins..."
    agy plugin install https://github.com/DietrichGebert/ponytail --silent || echo "   Ponytail plugin installation failed; continuing." >&2
    agy plugin install https://github.com/addyosmani/agent-skills.git --silent || echo "   Agent Skills plugin installation failed; continuing." >&2
fi

# 5. Finalize Git Repository
echo -e "\n\033[1;33m5️⃣ Finalizing Git Baseline...\033[0m"
if [ -d ".git" ]; then
    git add .
    if ! git commit -m "feat: initial project setup with agent skills and tools" --quiet; then
        echo "   Nothing committed; check Git identity or repository state." >&2
    fi
    echo "   Git finalization phase complete; review any warnings above."
fi

echo -e "\n\033[1;32m==========================================================\033[0m"
echo -e "\033[1;32m   🎉 Vibe Coding Stack Ready!                           \033[0m"
echo -e "\033[1;32m==========================================================\033[0m"
echo ""
echo -e "\033[1;36m👉 WHAT TO DO NEXT (No terminal commands needed!):\033[0m"
echo "   1. Open your AI coding assistant (Antigravity / Cursor / Claude)."
echo "   2. In the AI chat, simply describe what you want to build:"
echo -e "\033[1;33m      Example: 'I want to build a modern personal portfolio.'\033[0m"
echo ""
echo "   The AI will automatically handle planning, design, and"
echo "   code quality in the background."
echo ""
echo -e "\033[0;90m💡 Optional shortcuts for advanced users:\033[0m"
echo -e "\033[0;90m   /spec   -> Write a PRD before writing code\033[0m"
echo -e "\033[0;90m   /plan   -> Break tasks into small verifiable steps\033[0m"
echo -e "\033[0;90m   /review -> Senior Staff quality review\033[0m"
echo -e "\033[1;32m==========================================================\033[0m"
