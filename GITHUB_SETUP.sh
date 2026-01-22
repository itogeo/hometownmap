#!/bin/bash

# HometownMap - GitHub Setup Script
# This script helps you push the project to GitHub

set -e  # Exit on error

echo "🚀 HometownMap GitHub Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the hometownmap root directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📝 Found uncommitted changes. Staging all files..."
    git add .

    echo ""
    echo "💬 Creating commit..."
    git commit -m "Initial commit: HometownMap foundation

- Next.js frontend with Mapbox integration
- 5-mode interface (Resident, Business, Recreation, Services, Development)
- Enhanced search with fuzzy matching
- Business directory component
- Resource links panel
- Welcome/onboarding modal
- Python ETL pipeline for data processing
- Demo data for Three Forks
- Complete documentation

Built with Claude Code - Ready for deployment!"

    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

# Set main branch
echo ""
echo "🌿 Setting main branch..."
git branch -M main
echo "✅ Branch set to 'main'"

# Check if remote exists
if git remote | grep -q "origin"; then
    echo ""
    echo "⚠️  Remote 'origin' already exists"
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "   Current remote: $CURRENT_REMOTE"
    echo ""
    read -p "Do you want to change it to https://github.com/itogeo/hometownmap.git? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin https://github.com/itogeo/hometownmap.git
        echo "✅ Remote updated"
    fi
else
    echo ""
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/itogeo/hometownmap.git
    echo "✅ Remote added: https://github.com/itogeo/hometownmap"
fi

echo ""
echo "=============================="
echo "📤 Ready to push to GitHub!"
echo "=============================="
echo ""
echo "Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   👉 https://github.com/new"
echo "   - Repository name: hometownmap"
echo "   - Owner: itogeo"
echo "   - Make it Private (for now)"
echo "   - Don't initialize with README"
echo ""
echo "2. Then push your code:"
echo "   git push -u origin main"
echo ""
echo "3. If you get authentication errors:"
echo "   - Use a Personal Access Token instead of password"
echo "   - Create one at: https://github.com/settings/tokens"
echo ""
echo "🎉 You're all set!"
