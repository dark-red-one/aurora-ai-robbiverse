#!/usr/bin/env python3
"""
Simple WebSocket test with FastAPI
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("🔌 WebSocket connection received")
    await websocket.accept()
    print("✅ WebSocket accepted")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"📨 Received: {data}")
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected")

# Debug: Print all routes
print("🔍 Registered routes:")
for route in app.routes:
    print(f"  - {route}")

@app.get("/")
async def root():
    return {"message": "WebSocket test server"}

if __name__ == "__main__":
    print("🚀 Starting simple WebSocket test server on port 8009")
    uvicorn.run(app, host="0.0.0.0", port=8009)
