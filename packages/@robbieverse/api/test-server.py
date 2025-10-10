#!/usr/bin/env python3
"""
Quick test server to verify static file serving works
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pathlib import Path
import uvicorn

app = FastAPI()

# Get absolute path
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static" / "code"

print(f"📂 Static directory: {STATIC_DIR}")
print(f"📂 Exists: {STATIC_DIR.exists()}")
print(f"📂 Files: {list(STATIC_DIR.glob('*')) if STATIC_DIR.exists() else 'N/A'}")

@app.get("/")
async def root():
    return {"message": "Test server running"}

@app.get("/test")
async def test():
    html = """
    <html>
        <head><title>Test Page</title></head>
        <body>
            <h1>Test Server Works!</h1>
            <p>If you can see this, the server is responding.</p>
        </body>
    </html>
    """
    return HTMLResponse(content=html)

# Try mounting static files
if STATIC_DIR.exists():
    print("✅ Mounting static files at /static")
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    print("❌ Static directory not found!")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)



