#!/usr/bin/env python3
"""
Live demo of the Smart AI System
"""
import asyncio
import sys
sys.path.append('backend/services')

from IntegratedAIService import get_integrated_service
from DailyBriefSystem import get_brief_system

async def main():
    print('\n' + '='*70)
    print('🧠 SMART AI SYSTEM - LIVE DEMO')
    print('='*70)
    
    service = get_integrated_service(user_id='allan')
    
    # Demo 1: Smart Chat
    print('\n1. SMART CHAT (with learning & circuit breaker)')
    print('-'*70)
    response = await service.chat('What makes a great AI assistant?')
    print(f'Response: {response["content"][:200]}...')
    print(f'Model: {response["model"]} ({response["tier"]})')
    print(f'Time: {response["response_time"]:.2f}s')
    print(f'Learning: {response["learning"]["topic"]} task')
    
    # Demo 2: Code Question
    print('\n2. CODE TASK (learning classifies automatically)')
    print('-'*70)
    response = await service.chat('Write Python hello world')
    print(f'Response: {response["content"][:150]}...')
    print(f'Classified as: {response["learning"]["topic"]}')
    
    # Demo 3: System Status
    print('\n3. SYSTEM HEALTH STATUS')
    print('-'*70)
    status = await service.get_system_status()
    health = status['health']['summary']
    print(f'Services: {health["healthy"]}/{health["total"]} healthy')
    
    for name, svc in status['health']['services'].items():
        icon = '✅' if svc['status'] == 'healthy' else '❌'
        print(f'  {icon} {name:20s} {svc["status"]:10s} ({svc["response_time"]:.3f}s)')
    
    # Demo 4: Learning Stats
    print('\n4. LEARNING STATISTICS')
    print('-'*70)
    stats = status['learning_stats']
    print(f'Total interactions: {stats["total_interactions"]}')
    print(f'Total users: {stats["total_users"]}')
    print(f'System is learning from every interaction!')
    
    # Demo 5: Daily Brief
    print('\n5. DAILY BRIEF SAMPLE')
    print('-'*70)
    brief_system = get_brief_system()
    brief = await brief_system.generate_morning_brief()
    
    print('TOP 3 OUTREACH OPPORTUNITIES:')
    for i, opp in enumerate(brief.outreach_opportunities, 1):
        print(f'  {i}. {opp.contact_name} @ {opp.company}')
        print(f'     ${opp.revenue_potential:,.0f} potential - {opp.action}')
    
    print('\n' + '='*70)
    print('✨ Demo complete! All systems operational and learning.')
    print('='*70 + '\n')

if __name__ == '__main__':
    asyncio.run(main())


