#!/usr/bin/env python3
import asyncio
import sys
from aiohttp import web

async def hello(request):
    return web.json_response({'status': 'ok', 'message': 'test'})

async def init_app():
    app = web.Application()
    app.router.add_get('/', hello)
    return app

async def main():
    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', 9000)
    await site.start()
    print("Server started on http://127.0.0.1:9000")
    print("Press Ctrl+C to stop")

    try:
        # Keep the server running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
