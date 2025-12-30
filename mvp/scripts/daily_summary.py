#!/usr/bin/env python3
"""
Generate a daily development summary
Usage: python scripts/daily_summary.py
"""

import subprocess
from datetime import datetime, timedelta
from pathlib import Path

def get_today_commits():
    """Get commits from today"""
    today = datetime.now().strftime('%Y-%m-%d')
    try:
        commits = subprocess.check_output(
            ['git', 'log', '--since', today, '--oneline'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        return commits.split('\n') if commits else []
    except:
        return []

def get_files_changed_today():
    """Get list of files changed today"""
    today = datetime.now().strftime('%Y-%m-%d')
    try:
        files = subprocess.check_output(
            ['git', 'log', '--since', today, '--name-only', '--pretty=format:'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        unique_files = list(set([f for f in files.split('\n') if f]))
        return unique_files
    except:
        return []

def get_today_errors():
    """Get errors logged today"""
    today = datetime.now().strftime('%Y-%m-%d')
    error_log = Path(f'docs/errors/{today}-errors.log')
    
    if error_log.exists():
        with open(error_log, 'r') as f:
            errors = f.read()
        return errors.count('[')  # Count of error entries
    return 0

def get_lines_changed():
    """Get lines added/removed today"""
    today = datetime.now().strftime('%Y-%m-%d')
    try:
        stats = subprocess.check_output(
            ['git', 'log', '--since', today, '--shortstat'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        # Parse stats
        lines_added = 0
        lines_removed = 0
        for line in stats.split('\n'):
            if 'insertion' in line:
                parts = line.split(',')
                for part in parts:
                    if 'insertion' in part:
                        lines_added += int(part.strip().split()[0])
                    if 'deletion' in part:
                        lines_removed += int(part.strip().split()[0])
        
        return lines_added, lines_removed
    except:
        return 0, 0

def generate_summary():
    """Generate daily development summary"""
    today = datetime.now().strftime('%Y-%m-%d')
    commits = get_today_commits()
    files = get_files_changed_today()
    errors = get_today_errors()
    lines_added, lines_removed = get_lines_changed()
    
    summary = f"""# Daily Development Summary - {today}

## Activity Overview
- **Commits:** {len(commits)}
- **Files Changed:** {len(files)}
- **Lines Added:** +{lines_added}
- **Lines Removed:** -{lines_removed}
- **Errors Logged:** {errors}

## Commits Today
"""
    
    if commits:
        for commit in commits:
            summary += f"- {commit}\n"
    else:
        summary += "*No commits today*\n"
    
    summary += "\n## Files Modified\n"
    
    if files:
        # Group files by directory
        by_dir = {}
        for file in files:
            dir_name = str(Path(file).parent)
            if dir_name not in by_dir:
                by_dir[dir_name] = []
            by_dir[dir_name].append(Path(file).name)
        
        for dir_name, file_list in sorted(by_dir.items()):
            if dir_name == '.':
                summary += f"\n**Root:**\n"
            else:
                summary += f"\n**{dir_name}:**\n"
            for fname in sorted(file_list):
                summary += f"- {fname}\n"
    else:
        summary += "*No files changed*\n"
    
    # Add time estimate
    estimated_hours = len(commits) * 0.5  # Rough estimate
    summary += f"\n## Estimated Time\n"
    summary += f"~{estimated_hours:.1f} hours (based on {len(commits)} commits)\n"
    
    summary += f"\n## What I Worked On\n"
    summary += "[Describe what you accomplished today]\n\n"
    
    summary += f"## Blockers & Challenges\n"
    summary += "[Note any issues encountered]\n\n"
    
    summary += f"## Tomorrow's Plan\n"
    summary += "[What to focus on tomorrow]\n\n"
    
    summary += f"## Notes\n"
    summary += "[Any additional thoughts or learnings]\n"
    
    # Save to journal
    journal_dir = Path('docs/journal')
    journal_dir.mkdir(parents=True, exist_ok=True)
    
    summary_file = journal_dir / f'{today}-summary.md'
    with open(summary_file, 'w') as f:
        f.write(summary)
    
    print(summary)
    print(f"\n✅ Summary saved to {summary_file}")
    print(f"\n💡 Edit the file to add details about what you worked on!")

if __name__ == '__main__':
    generate_summary()
