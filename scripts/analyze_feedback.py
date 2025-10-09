#!/usr/bin/env python3
"""
Analyze Tester Experience Feedback
Purpose: Extract top pain points from 1,000 feedback entries before Walmart launch
Author: Robbie AI
Date: October 9, 2025
"""

import json
from collections import Counter
from datetime import datetime
import re

def load_feedback():
    """Load feedback from JSON export"""
    with open('exports/feedback.json', 'r') as f:
        return json.load(f)

def analyze_low_ratings(feedback_data):
    """Analyze 1-2 star ratings"""
    low_ratings = [
        f for f in feedback_data 
        if f['rating'] in [1, 2] 
        and f['comment'] 
        and f['comment'].lower() not in ['.', 'na', 'n/a', 'nothing', '']
    ]
    
    print(f"\n{'='*60}")
    print(f"LOW RATING ANALYSIS (1-2 Stars)")
    print(f"{'='*60}")
    print(f"Total low ratings with comments: {len(low_ratings)}\n")
    
    for item in low_ratings[:20]:  # Show first 20
        print(f"★{item['rating']} - {item['created_at'][:10]}")
        print(f"   \"{item['comment']}\"")
        print()
    
    return low_ratings

def rating_distribution(feedback_data):
    """Calculate rating distribution"""
    ratings = [f['rating'] for f in feedback_data if f['rating']]
    rating_counts = Counter(ratings)
    total = len(ratings)
    
    print(f"\n{'='*60}")
    print(f"RATING DISTRIBUTION")
    print(f"{'='*60}")
    print(f"Total feedback: {total}\n")
    
    for rating in sorted(rating_counts.keys()):
        count = rating_counts[rating]
        percentage = (count / total) * 100
        bar = '█' * int(percentage / 2)
        print(f"★{rating}: {count:4d} ({percentage:5.1f}%) {bar}")
    
    avg_rating = sum(ratings) / len(ratings)
    print(f"\nAverage rating: {avg_rating:.2f} / 5.00")

def categorize_issues(feedback_data):
    """Categorize common complaints"""
    categories = {
        'UX/Experience': r'(experience|better|improve|interface|design|user)',
        'Study/Test Quality': r'(study|test|question|survey|product)',
        'Pricing': r'(price|cost|expensive|cheap|value)',
        'Performance': r'(slow|loading|wait|lag|speed)',
        'Clarity/Instructions': r'(confus|understand|clear|instruct|help)',
        'Technical Issues': r'(bug|error|fail|broken|crash|issue)',
        'Reviews/Social Proof': r'(review|rating|feedback|amazon)',
    }
    
    low_ratings = [
        f for f in feedback_data 
        if f['rating'] in [1, 2, 3]  # Include 3-star for more data
        and f['comment']
        and f['comment'].lower() not in ['.', 'na', 'n/a', 'nothing', '']
    ]
    
    categorized = {cat: [] for cat in categories.keys()}
    categorized['Other'] = []
    
    for item in low_ratings:
        comment_lower = item['comment'].lower()
        matched = False
        
        for category, pattern in categories.items():
            if re.search(pattern, comment_lower):
                categorized[category].append(item)
                matched = True
                break
        
        if not matched:
            categorized['Other'].append(item)
    
    print(f"\n{'='*60}")
    print(f"ISSUE CATEGORIES")
    print(f"{'='*60}\n")
    
    sorted_cats = sorted(categorized.items(), key=lambda x: len(x[1]), reverse=True)
    
    for category, items in sorted_cats:
        if len(items) > 0:
            print(f"\n{category}: {len(items)} mentions")
            print(f"{'-'*60}")
            for item in items[:3]:  # Show top 3 examples
                print(f"  ★{item['rating']}: \"{item['comment'][:80]}...\"" if len(item['comment']) > 80 else f"  ★{item['rating']}: \"{item['comment']}\"")
    
    return categorized

def generate_fix_list(categorized):
    """Generate prioritized fix list"""
    print(f"\n{'='*60}")
    print(f"TOP 3 ISSUES TO FIX BEFORE WALMART LAUNCH (Oct 21)")
    print(f"{'='*60}\n")
    
    # Sort by frequency
    sorted_issues = sorted(categorized.items(), key=lambda x: len(x[1]), reverse=True)
    
    priority_map = {
        'UX/Experience': {'effort': '2-3 days', 'priority': 1},
        'Study/Test Quality': {'effort': '3-4 days', 'priority': 2},
        'Clarity/Instructions': {'effort': '1-2 days', 'priority': 3},
        'Performance': {'effort': '2-3 days', 'priority': 4},
        'Technical Issues': {'effort': '1-2 days', 'priority': 5},
    }
    
    fixes = []
    for category, items in sorted_issues[:5]:
        if len(items) >= 3 and category in priority_map:  # Only if 3+ mentions
            info = priority_map[category]
            fixes.append({
                'category': category,
                'count': len(items),
                'examples': [item['comment'] for item in items[:3]],
                'effort': info['effort'],
                'priority': info['priority']
            })
    
    # Sort by priority
    fixes.sort(key=lambda x: x['priority'])
    
    for i, fix in enumerate(fixes[:3], 1):
        print(f"{i}. {fix['category']} - {fix['count']} mentions")
        print(f"   Priority: {'🔴 HIGH' if i == 1 else '🟡 MEDIUM' if i == 2 else '🟢 LOW'}")
        print(f"   Effort: {fix['effort']}")
        print(f"\n   Example quotes:")
        for quote in fix['examples']:
            print(f"   • \"{quote}\"")
        print(f"\n   Recommended fix:")
        print(f"   → [MANUAL: Analyze these comments and propose specific solution]")
        print()

def main():
    """Run feedback analysis"""
    print(f"\n{'#'*60}")
    print(f"# TESTPILOT TESTER EXPERIENCE FEEDBACK ANALYSIS")
    print(f"# Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"# Purpose: Identify pain points before Walmart launch")
    print(f"{'#'*60}")
    
    feedback_data = load_feedback()
    
    # Run analyses
    rating_distribution(feedback_data)
    low_ratings = analyze_low_ratings(feedback_data)
    categorized = categorize_issues(feedback_data)
    generate_fix_list(categorized)
    
    print(f"\n{'='*60}")
    print(f"NEXT STEPS:")
    print(f"{'='*60}")
    print(f"1. Review top 3 issues above")
    print(f"2. Create GitHub issues for each fix")
    print(f"3. Assign to Andre with Oct 21 deadline")
    print(f"4. Track post-Walmart feedback to measure improvement")
    print()

if __name__ == '__main__':
    main()

