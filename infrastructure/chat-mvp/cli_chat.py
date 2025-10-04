#!/usr/bin/env python3
import asyncio, json, os, sys
try:
    import websockets
except Exception:
    print('Installing websockets...')
    os.system('pip install --quiet websockets')
    import websockets

WS_URL = os.environ.get('TESTPILOT_WS', 'ws://localhost:8005/ws')

BANNER = '''
🚀 TestPilot Chat CLI (type /quit to exit)
==========================================
Connected to: {url}
'''

async def reader(ws):
    try:
        async for msg in ws:
            try:
                data = json.loads(msg)
                content = data.get('content', '')
            except Exception:
                content = msg
            print('\n[Robbie]')
            print(content)
            print('\n> ', end='', flush=True)
    except Exception as e:
        print(f"\n[system] connection closed: {e}")

async def writer(ws):
    loop = asyncio.get_event_loop()
    print('> ', end='', flush=True)
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        line = line.strip()
        if line in ('/q', '/quit', 'exit'):
            break
        if not line:
            print('> ', end='', flush=True)
            continue
        await ws.send(json.dumps({"type":"message","content":line}))
        print('> ', end='', flush=True)

async def main():
    print(BANNER.format(url=WS_URL))
    async with websockets.connect(WS_URL, ping_interval=None) as ws:
        await asyncio.gather(reader(ws), writer(ws))

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\nGoodbye!')