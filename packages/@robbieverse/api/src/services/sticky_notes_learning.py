"""
Sticky Notes Learning Service - Get SMARTER over time! 🧠📈
Track what's helpful, learn patterns, improve surfacing accuracy
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")

class StickyNotesLearningService:
    """
    Machine learning for sticky notes surfacing
    Learns from every interaction to get smarter!
    """
    
    def __init__(self):
        self.db = psycopg2.connect(DATABASE_URL)
    
    def learn_from_interactions(self, days: int = 30) -> Dict:
        """
        Analyze past interactions to identify patterns
        Returns learned patterns and confidence scores
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        patterns = {
            "helpful_categories": self._learn_helpful_categories(cursor, days),
            "optimal_timing": self._learn_optimal_timing(cursor, days),
            "effective_context_tags": self._learn_effective_tags(cursor, days),
            "dismiss_patterns": self._learn_dismiss_patterns(cursor, days),
            "engagement_score": self._calculate_engagement_score(cursor, days)
        }
        
        cursor.close()
        
        # Store learned patterns
        self._store_patterns(patterns)
        
        return patterns
    
    def _learn_helpful_categories(self, cursor, days: int) -> List[Dict]:
        """Learn which categories are most helpful when surfaced"""
        cursor.execute("""
            SELECT 
                sn.category,
                COUNT(*) as surface_count,
                SUM(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END) as helpful_count,
                ROUND(AVG(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END)::numeric, 3) as helpfulness_rate,
                AVG(sns.time_to_action_seconds) as avg_time_to_action
            FROM sticky_notes sn
            JOIN sticky_note_surfaces sns ON sns.note_id = sn.id
            WHERE sns.surfaced_at >= NOW() - INTERVAL '%s days'
            GROUP BY sn.category
            HAVING COUNT(*) >= 3
            ORDER BY helpfulness_rate DESC
        """, (days,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _learn_optimal_timing(self, cursor, days: int) -> List[Dict]:
        """Learn best times of day for surfacing"""
        cursor.execute("""
            SELECT 
                EXTRACT(HOUR FROM sns.surfaced_at) as hour_of_day,
                COUNT(*) as surface_count,
                SUM(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END) as helpful_count,
                ROUND(AVG(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END)::numeric, 3) as helpfulness_rate
            FROM sticky_note_surfaces sns
            WHERE sns.surfaced_at >= NOW() - INTERVAL '%s days'
            AND sns.was_helpful IS NOT NULL
            GROUP BY hour_of_day
            ORDER BY helpfulness_rate DESC
        """, (days,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _learn_effective_tags(self, cursor, days: int) -> List[Dict]:
        """Learn which context tags lead to helpful surfacing"""
        cursor.execute("""
            SELECT 
                unnest(sn.context_tags) as tag,
                COUNT(*) as usage_count,
                SUM(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END) as helpful_count,
                ROUND(AVG(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END)::numeric, 3) as helpfulness_rate
            FROM sticky_notes sn
            JOIN sticky_note_surfaces sns ON sns.note_id = sn.id
            WHERE sns.surfaced_at >= NOW() - INTERVAL '%s days'
            AND sn.context_tags IS NOT NULL
            GROUP BY tag
            HAVING COUNT(*) >= 2
            ORDER BY helpfulness_rate DESC, usage_count DESC
        """, (days,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _learn_dismiss_patterns(self, cursor, days: int) -> List[Dict]:
        """Learn why notes get dismissed"""
        cursor.execute("""
            SELECT 
                sn.surface_reason,
                COUNT(*) as dismiss_count,
                AVG(sn.surface_priority) as avg_priority_when_dismissed
            FROM sticky_notes sn
            JOIN sticky_note_surfaces sns ON sns.note_id = sn.id
            WHERE sns.user_action = 'dismissed'
            AND sns.surfaced_at >= NOW() - INTERVAL '%s days'
            GROUP BY sn.surface_reason
            HAVING COUNT(*) >= 2
            ORDER BY dismiss_count DESC
        """, (days,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _calculate_engagement_score(self, cursor, days: int) -> Dict:
        """Calculate overall engagement with surfaced notes"""
        cursor.execute("""
            SELECT 
                COUNT(*) as total_surfaced,
                SUM(CASE WHEN was_helpful THEN 1 ELSE 0 END) as helpful_interactions,
                SUM(CASE WHEN user_action = 'dismissed' THEN 1 ELSE 0 END) as dismissed,
                SUM(CASE WHEN user_action = 'clicked_link' THEN 1 ELSE 0 END) as clicked_links,
                SUM(CASE WHEN user_action = 'edited' THEN 1 ELSE 0 END) as edited,
                AVG(time_to_action_seconds) as avg_time_to_action
            FROM sticky_note_surfaces
            WHERE surfaced_at >= NOW() - INTERVAL '%s days'
        """, (days,))
        
        result = cursor.fetchone()
        total = result['total_surfaced'] or 1
        
        return {
            "total_surfaced": result['total_surfaced'],
            "helpful_interactions": result['helpful_interactions'],
            "dismissed": result['dismissed'],
            "clicked_links": result['clicked_links'],
            "edited": result['edited'],
            "engagement_rate": round((result['helpful_interactions'] or 0) / total, 3),
            "dismiss_rate": round((result['dismissed'] or 0) / total, 3),
            "avg_time_to_action_seconds": result['avg_time_to_action']
        }
    
    def _store_patterns(self, patterns: Dict):
        """Store learned patterns in database"""
        cursor = self.db.cursor()
        
        for pattern_type, pattern_data in patterns.items():
            # Calculate confidence based on pattern data
            confidence = self._calculate_confidence(pattern_type, pattern_data)
            
            cursor.execute("""
                INSERT INTO sticky_note_learning (pattern_type, pattern_data, confidence_score, last_used)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (pattern_type) DO UPDATE SET
                    pattern_data = EXCLUDED.pattern_data,
                    confidence_score = EXCLUDED.confidence_score,
                    last_used = NOW(),
                    updated_at = NOW()
            """, (pattern_type, json.dumps(pattern_data, default=str), confidence))
        
        self.db.commit()
        cursor.close()
    
    def _calculate_confidence(self, pattern_type: str, data: any) -> float:
        """Calculate confidence score for a pattern (0-1)"""
        if pattern_type == "engagement_score":
            return min(data.get("engagement_rate", 0), 1.0)
        
        if isinstance(data, list) and len(data) > 0:
            # Average helpfulness rate of top patterns
            rates = [item.get("helpfulness_rate", 0) for item in data[:5]]
            return sum(rates) / len(rates) if rates else 0.5
        
        return 0.5  # Default moderate confidence
    
    def get_recommendations(self) -> Dict:
        """Get recommendations based on learned patterns"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT pattern_type, pattern_data, confidence_score
            FROM sticky_note_learning
            WHERE confidence_score >= 0.6
            ORDER BY confidence_score DESC, updated_at DESC
        """)
        
        patterns = cursor.fetchall()
        cursor.close()
        
        recommendations = []
        
        for pattern in patterns:
            pattern_data = json.loads(pattern['pattern_data']) if isinstance(pattern['pattern_data'], str) else pattern['pattern_data']
            
            if pattern['pattern_type'] == 'helpful_categories':
                top_categories = pattern_data[:3]
                if top_categories:
                    recommendations.append({
                        "type": "category_priority",
                        "message": f"Notes in these categories are most helpful: {', '.join([c['category'] for c in top_categories])}",
                        "confidence": pattern['confidence_score'],
                        "action": "prioritize_categories",
                        "data": top_categories
                    })
            
            elif pattern['pattern_type'] == 'optimal_timing':
                best_hours = [h for h in pattern_data if h['helpfulness_rate'] >= 0.7]
                if best_hours:
                    recommendations.append({
                        "type": "timing_optimization",
                        "message": f"Best hours for surfacing: {', '.join([str(int(h['hour_of_day'])) + ':00' for h in best_hours[:3]])}",
                        "confidence": pattern['confidence_score'],
                        "action": "optimize_timing",
                        "data": best_hours
                    })
            
            elif pattern['pattern_type'] == 'dismiss_patterns':
                frequent_dismissals = [d for d in pattern_data if d['dismiss_count'] >= 3]
                if frequent_dismissals:
                    recommendations.append({
                        "type": "avoid_surfacing",
                        "message": f"These surface reasons often get dismissed: {frequent_dismissals[0]['surface_reason']}",
                        "confidence": pattern['confidence_score'],
                        "action": "reduce_priority",
                        "data": frequent_dismissals
                    })
        
        return {
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
            "last_updated": datetime.now().isoformat()
        }
    
    def run_learning_cycle(self) -> Dict:
        """Complete learning cycle - learn and generate recommendations"""
        patterns = self.learn_from_interactions(days=30)
        recommendations = self.get_recommendations()
        
        return {
            "patterns_learned": patterns,
            "recommendations": recommendations,
            "cycle_complete": datetime.now().isoformat()
        }


# Convenience functions
def learn_now() -> Dict:
    """Quick function to run learning cycle"""
    service = StickyNotesLearningService()
    return service.run_learning_cycle()

def get_smart_recommendations() -> Dict:
    """Quick function to get recommendations"""
    service = StickyNotesLearningService()
    return service.get_recommendations()
