# Quick Start - Ollama Upgrade

## TL;DR

Robbie now has 3 brains and picks the right one automatically. Install models, test, use.

## Step 1: Install Models (5-10 min)

```bash
cd /Users/allanperetz/aurora-ai-robbiverse
./scripts/setup-ollama-models.sh
```

This pulls and configures:
- Fast model (7B) - Quick responses
- Smart model (32K) - Deep analysis
- Vision model (11B) - See images

## Step 2: Test (30 sec)

```bash
python3 scripts/test-integration.py
```

Should see: ✅ All tests passed

## Step 3: Use It

### In Python Code

```python
from packages.@robbieverse.api.src.ai.robbie_ai import RobbieAI

robbie = RobbieAI()

# Automatic routing - just ask
async for chunk in robbie.stream_response(
    message="Analyze this complex architecture",
    context={"file_count": 5}
):
    print(chunk)
    # → Uses smart model automatically
```

### With Vision

```python
from packages.@robbieverse.api.src.ai.vision_handler import analyze_screenshot

result = await analyze_screenshot("screenshot.png")

print(result["analysis"]["issues"])
print(result["analysis"]["quick_wins"])
```

### In Cursor (MCP)

Use the new tools:
- `route_smart` - Auto-select best model
- `analyze_screenshot` - Vision analysis
- `chat` - Now supports images

## That's It

Smart routing is automatic. Just use Robbie normally and she'll pick the right brain.

**Fast questions → Fast model**  
**Complex tasks → Smart model**  
**Images → Vision model**

All automatic. All tested. All working.

---

Need details? See `docs/OLLAMA_UPGRADE_GUIDE.md`

Questions? Run `python3 scripts/test-model-routing.py` to see routing logic in action.


