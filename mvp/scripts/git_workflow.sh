#!/bin/bash
# Git Workflow Helper for CommonGround
# Usage: ./scripts/git_workflow.sh

echo "🚀 CommonGround Git Workflow Helper"
echo ""

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Show changed files
echo "📝 Changed files:"
git status -s
echo ""

# Ask for commit type
echo "Select commit type:"
echo "1) feat     - New feature"
echo "2) fix      - Bug fix"
echo "3) docs     - Documentation"
echo "4) refactor - Code refactoring"
echo "5) test     - Adding tests"
echo "6) chore    - Maintenance"
echo "7) security - Security improvement"
read -p "Type (1-7): " commit_type

case $commit_type in
    1) type="feat";;
    2) type="fix";;
    3) type="docs";;
    4) type="refactor";;
    5) type="test";;
    6) type="chore";;
    7) type="security";;
    *) echo "❌ Invalid type"; exit 1;;
esac

# Ask for scope
read -p "Scope (e.g., auth, agreements, api) [optional]: " scope

# Ask for message
read -p "Short description: " description

# Check if description is empty
if [[ -z "$description" ]]; then
    echo "❌ Description cannot be empty"
    exit 1
fi

# Build commit message
if [[ -n $scope ]]; then
    commit_msg="${type}(${scope}): ${description}"
else
    commit_msg="${type}: ${description}"
fi

echo ""
echo "📋 Commit message:"
echo "   $commit_msg"
echo ""

read -p "Proceed with commit? (y/n): " proceed

if [[ $proceed != "y" ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Stage all changes
git add .

# Commit
git commit -m "$commit_msg"

echo "✅ Committed!"
echo ""

# Update changelog if script exists
if [[ -f "scripts/update_changelog.py" ]] && command -v python3 &> /dev/null; then
    echo "📝 Updating changelog..."
    python3 scripts/update_changelog.py
    
    # Check if changelog was modified
    if [[ -n $(git status -s CHANGELOG.md) ]]; then
        # Amend commit with changelog
        git add CHANGELOG.md
        git commit --amend --no-edit
        echo "✅ Changelog updated"
    fi
fi

echo ""
read -p "Push to remote? (y/n): " push

if [[ $push == "y" ]]; then
    # Get current branch
    branch=$(git branch --show-current)
    
    # Check if branch exists on remote
    if git ls-remote --exit-code --heads origin $branch &> /dev/null; then
        # Branch exists, push normally
        git push origin $branch
    else
        # New branch, set upstream
        git push -u origin $branch
    fi
    
    echo "✅ Pushed to origin/$branch"
fi

echo ""
echo "🎉 Done!"
