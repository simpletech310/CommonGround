#!/usr/bin/env python3
"""
Automatically update CHANGELOG.md based on git commits since last tag
Usage: python scripts/update_changelog.py
"""

import subprocess
from datetime import datetime

def get_commits_since_last_tag():
    """Get all commits since last version tag"""
    try:
        last_tag = subprocess.check_output(
            ['git', 'describe', '--tags', '--abbrev=0'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except:
        last_tag = None
    
    if last_tag:
        commits = subprocess.check_output(
            ['git', 'log', f'{last_tag}..HEAD', '--oneline']
        ).decode().strip().split('\n')
    else:
        commits = subprocess.check_output(
            ['git', 'log', '--oneline']
        ).decode().strip().split('\n')
    
    return commits

def categorize_commit(commit_msg):
    """Categorize commit by conventional commit prefix"""
    if commit_msg.startswith('feat:'):
        return 'Added'
    elif commit_msg.startswith('fix:'):
        return 'Fixed'
    elif commit_msg.startswith('docs:'):
        return 'Documentation'
    elif commit_msg.startswith('refactor:'):
        return 'Changed'
    elif commit_msg.startswith('test:'):
        return 'Testing'
    elif commit_msg.startswith('chore:'):
        return 'Maintenance'
    elif commit_msg.startswith('security:'):
        return 'Security'
    else:
        return 'Changed'

def update_changelog():
    """Update CHANGELOG.md with new commits"""
    commits = get_commits_since_last_tag()
    
    categorized = {
        'Added': [],
        'Changed': [],
        'Fixed': [],
        'Security': [],
        'Documentation': []
    }
    
    for commit in commits:
        if not commit:
            continue
        msg = commit.split(' ', 1)[1] if ' ' in commit else commit
        category = categorize_commit(msg)
        if category in categorized:
            # Remove prefix for cleaner changelog
            clean_msg = msg.split(':', 1)[1].strip() if ':' in msg else msg
            categorized[category].append(f"- {clean_msg}")
    
    # Read current changelog
    try:
        with open('CHANGELOG.md', 'r') as f:
            changelog = f.read()
    except:
        changelog = "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n"
    
    # Build new unreleased section
    today = datetime.now().strftime('%Y-%m-%d')
    unreleased = ["\n## [Unreleased]\n"]
    
    for category in ['Added', 'Changed', 'Fixed', 'Security', 'Documentation']:
        if categorized[category]:
            unreleased.append(f"\n### {category}\n")
            unreleased.extend([f"{item}\n" for item in categorized[category]])
    
    # Insert after title
    if '## [Unreleased]' in changelog:
        # Replace existing unreleased section
        parts = changelog.split('## [Unreleased]')
        # Find next version section
        remaining = parts[1].split('\n## [', 1)
        if len(remaining) > 1:
            new_changelog = parts[0] + ''.join(unreleased) + '\n## [' + remaining[1]
        else:
            new_changelog = parts[0] + ''.join(unreleased)
    else:
        lines = changelog.split('\n')
        new_changelog = lines[0] + '\n' + ''.join(unreleased) + '\n'.join(lines[1:])
    
    # Write back
    with open('CHANGELOG.md', 'w') as f:
        f.write(new_changelog)
    
    print(f"✅ Updated CHANGELOG.md with {len(commits)} commits")

if __name__ == '__main__':
    update_changelog()
