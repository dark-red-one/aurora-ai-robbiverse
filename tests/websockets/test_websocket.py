#!/usr/bin/env python3
"""
Simple WebSocket test server
"""
import asyncio
import websockets
import json

async def handle_connection(websocket, path):
    print(f"🔌 WebSocket connection received from {websocket.remote_address}")
    await websocket.send("✅ Connected successfully!")
    
    try:
        async for message in websocket:
            print(f"📨 Received: {message}")
            response = f"Echo: {message}"
            await websocket.send(response)
    except websockets.exceptions.ConnectionClosed:
        print("🔌 WebSocket connection closed")

async def main():
    print("🚀 Starting test WebSocket server on port 8008")
    async with websockets.serve(handle_connection, "0.0.0.0", 8008):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
