#!/usr/bin/env python3
"""
Log an error to the appropriate files
Usage: python scripts/log_error.py
"""

import sys
from datetime import datetime
from pathlib import Path

def log_error():
    """Interactive error logging"""
    print("🐛 Error Logger\n")
    
    # Gather error details
    error_title = input("Error title (brief): ")
    error_file = input("File where error occurred: ")
    error_message = input("Error message: ")
    
    print("\nStack trace (paste below, press Ctrl+D when done on Mac/Linux, Ctrl+Z then Enter on Windows):")
    try:
        stack_trace = sys.stdin.read()
    except KeyboardInterrupt:
        print("\n❌ Cancelled")
        return
    
    severity = input("\nSeverity (1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL): ")
    severity_map = {
        '1': 'LOW',
        '2': 'MEDIUM',
        '3': 'HIGH',
        '4': 'CRITICAL'
    }
    severity_text = severity_map.get(severity, 'MEDIUM')
    
    # Create docs/known-issues if doesn't exist
    issues_dir = Path('docs/known-issues')
    issues_dir.mkdir(parents=True, exist_ok=True)
    
    # Get next issue number
    existing_issues = list(issues_dir.glob('[0-9]*.md'))
    if existing_issues:
        numbers = [int(f.stem.split('-')[0]) for f in existing_issues]
        issue_num = max(numbers) + 1
    else:
        issue_num = 1
    
    # Create issue file
    today = datetime.now().strftime('%Y-%m-%d')
    slug = error_title.lower().replace(' ', '-').replace('/', '-')[:50]
    issue_file = issues_dir / f"{issue_num:03d}-{slug}.md"
    
    issue_content = f"""# Issue #{issue_num:03d}: {error_title}

## Status
🔴 OPEN

## Severity
{severity_text}

## First Occurred
{today}

## Last Occurred
{today}

## Description
{error_message}

## Symptoms
[Describe what the user experiences]

## Files Affected
- {error_file}

## Stack Trace
```
{stack_trace}
```

## Root Cause
[To be determined]

## Temporary Workaround
[If any]

## Permanent Solution
[To be implemented]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. Error occurs

## Fix Status
- [ ] Root cause identified
- [ ] Temporary workaround implemented
- [ ] Permanent fix designed
- [ ] Tests added
- [ ] Documentation updated

## Notes
Created: {today}
"""
    
    with open(issue_file, 'w') as f:
        f.write(issue_content)
    
    # Append to daily error log
    error_log_dir = Path('docs/errors')
    error_log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = error_log_dir / f"{today}-errors.log"
    log_entry = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {severity_text} | {error_file} | {error_message}\n"
    log_entry += f"→ Reference: docs/known-issues/{issue_file.name}\n\n"
    
    with open(log_file, 'a') as f:
        f.write(log_entry)
    
    print(f"\n✅ Error logged:")
    print(f"   Issue file: {issue_file}")
    print(f"   Log entry: {log_file}")
    print(f"\n💡 Next steps:")
    print(f"   1. Investigate root cause")
    print(f"   2. Update issue file with findings")
    print(f"   3. Mark as solved when fixed")

if __name__ == '__main__':
    try:
        log_error()
    except KeyboardInterrupt:
        print("\n❌ Cancelled")
