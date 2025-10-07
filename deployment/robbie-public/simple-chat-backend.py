#!/usr/bin/env python3
import asyncio
from aiohttp import web
import json

app = web.Application()

async def status_handler(request):
    return web.json_response({'status': 'online', 'message': 'Chat backend is running!'})

async def chat_handler(request):
    data = await request.json()
    message = data.get('message', '')
    return web.json_response({'response': f'Robbie: {message}', 'status': 'success'})

app.router.add_get('/api/status', status_handler)
app.router.add_post('/api/chat', chat_handler)

async def start_server():
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', 9000)
    await site.start()
    print('✅ Simple chat backend started on port 9000!')
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(start_server())
