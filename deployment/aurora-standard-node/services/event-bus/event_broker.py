#!/usr/bin/env python3
"""
Aurora Event Bus - Distributed event broker using Redis Pub/Sub
Connects all nodes for real-time event propagation
"""

import asyncio
import json
import os
import time
from datetime import datetime
from typing import Dict, Callable, List
import redis.asyncio as redis

# Configuration
NODE_NAME = os.getenv('NODE_NAME', 'unknown')
NODE_ROLE = os.getenv('NODE_ROLE', 'compute')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')

class AuroraEventBus:
    """Distributed event bus for Aurora mesh"""
    
    def __init__(self):
        self.node_name = NODE_NAME
        self.node_role = NODE_ROLE
        self.redis_client = None
        self.pubsub = None
        self.event_handlers = {}
        self.running = False
        
    async def connect(self):
        """Connect to Redis"""
        self.redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=True
        )
        
        # Test connection
        await self.redis_client.ping()
        print(f"✅ [{datetime.now().isoformat()}] Connected to Redis event bus")
        
        # Create pub/sub
        self.pubsub = self.redis_client.pubsub()
        
        # Subscribe to channels
        await self.subscribe_to_channels()
        
    async def subscribe_to_channels(self):
        """Subscribe to relevant event channels"""
        channels = [
            'aurora:events:global',              # All nodes
            f'aurora:events:role:{self.node_role}',  # Role-specific
            f'aurora:events:node:{self.node_name}',  # Node-specific
            'aurora:cache:invalidate',           # Cache invalidation
            'aurora:user:session',               # Session events
            'aurora:ai:task',                    # AI task events
            'aurora:system:alert',               # System alerts
        ]
        
        for channel in channels:
            await self.pubsub.subscribe(channel)
            print(f"📡 Subscribed to: {channel}")
        
        self.running = True
    
    async def publish_event(self, event_type: str, data: Dict, channel: str = 'aurora:events:global'):
        """Publish an event to the mesh"""
        event = {
            'type': event_type,
            'source_node': self.node_name,
            'source_role': self.node_role,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data
        }
        
        await self.redis_client.publish(channel, json.dumps(event))
        print(f"📤 [{datetime.now().isoformat()}] Published: {event_type} to {channel}")
    
    def register_handler(self, event_type: str, handler: Callable):
        """Register a handler for an event type"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
        print(f"🔧 Registered handler for: {event_type}")
    
    async def handle_event(self, event: Dict):
        """Handle incoming event"""
        event_type = event.get('type')
        source_node = event.get('source_node')
        
        # Don't process our own events (unless explicitly needed)
        if source_node == self.node_name:
            return
        
        print(f"📥 [{datetime.now().isoformat()}] Received: {event_type} from {source_node}")
        
        # Call registered handlers
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(event)
                    else:
                        handler(event)
                except Exception as e:
                    print(f"❌ Error in handler for {event_type}: {e}")
    
    async def listen(self):
        """Listen for events"""
        print(f"👂 [{datetime.now().isoformat()}] Listening for events...")
        
        while self.running:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                
                if message and message['type'] == 'message':
                    try:
                        event = json.loads(message['data'])
                        await self.handle_event(event)
                    except json.JSONDecodeError as e:
                        print(f"❌ Invalid JSON in event: {e}")
                
                await asyncio.sleep(0.01)  # Small sleep to prevent CPU spinning
                
            except Exception as e:
                print(f"❌ Error listening for events: {e}")
                await asyncio.sleep(1)
    
    async def heartbeat(self):
        """Send periodic heartbeat"""
        while self.running:
            await self.publish_event(
                'node_heartbeat',
                {
                    'node': self.node_name,
                    'role': self.node_role,
                    'status': 'active'
                },
                channel='aurora:events:global'
            )
            await asyncio.sleep(60)  # Every minute
    
    async def run(self):
        """Main run loop"""
        print(f"🚀 Starting Aurora Event Bus on node: {self.node_name} ({self.node_role})")
        
        # Connect to Redis
        await self.connect()
        
        # Register default handlers
        self.register_default_handlers()
        
        # Start listening and heartbeat
        await asyncio.gather(
            self.listen(),
            self.heartbeat()
        )
    
    def register_default_handlers(self):
        """Register default event handlers"""
        
        # Cache invalidation handler
        async def handle_cache_invalidate(event):
            cache_key = event['data'].get('key')
            print(f"🗑️  Cache invalidation: {cache_key}")
            # Implement actual cache invalidation logic here
        
        self.register_handler('cache_invalidate', handle_cache_invalidate)
        
        # User session handler
        async def handle_user_session(event):
            action = event['data'].get('action')
            user_id = event['data'].get('user_id')
            print(f"👤 User session event: {action} for user {user_id}")
            # Implement session sync logic here
        
        self.register_handler('user_session', handle_user_session)
        
        # AI task completion handler
        async def handle_ai_task_complete(event):
            task_id = event['data'].get('task_id')
            result = event['data'].get('result')
            print(f"🤖 AI task completed: {task_id}")
            # Notify other services about task completion
        
        self.register_handler('ai_task_complete', handle_ai_task_complete)
        
        # System alert handler
        async def handle_system_alert(event):
            alert = event['data'].get('alert')
            severity = event['data'].get('severity', 'info')
            print(f"⚠️  System alert ({severity}): {alert}")
            # Log alerts, send notifications, etc.
        
        self.register_handler('system_alert', handle_system_alert)
        
        # Node heartbeat handler
        async def handle_node_heartbeat(event):
            node = event['data'].get('node')
            # Track active nodes
            await self.redis_client.setex(
                f'aurora:node:active:{node}',
                120,  # 2 minute TTL
                datetime.utcnow().isoformat()
            )
        
        self.register_handler('node_heartbeat', handle_node_heartbeat)

async def main():
    """Main entry point"""
    event_bus = AuroraEventBus()
    
    try:
        await event_bus.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down event bus...")
        event_bus.running = False
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
