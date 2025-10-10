#!/usr/bin/env python3
"""
Benchmark Ollama Models
Compare performance of fast vs smart vs vision models
"""
import asyncio
import time
import httpx
from typing import List, Dict

OLLAMA_URL = "http://localhost:11434"

TEST_PROMPTS = [
    ("Quick Math", "What's 2+2?"),
    ("Code Question", "Explain Python list comprehensions in one sentence"),
    ("Architecture", "Describe microservices architecture in 3 bullet points"),
    ("Refactoring", "List 5 code refactoring best practices"),
]

async def benchmark_model(model: str, prompt: str) -> Dict:
    """Benchmark a single prompt on a model"""
    start = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                elapsed = time.time() - start
                
                return {
                    "success": True,
                    "time_ms": int(elapsed * 1000),
                    "response_length": len(data.get("response", "")),
                    "tokens": data.get("eval_count", 0),
                    "tokens_per_sec": data.get("eval_count", 0) / elapsed if elapsed > 0 else 0
                }
            else:
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}

async def run_benchmarks():
    """Run all benchmarks"""
    models = [
        ("Fast (7B)", "qwen2.5-coder:7b"),
        ("Smart (32K)", "qwen2.5-coder:32k"),
    ]
    
    print("\n" + "="*80)
    print("🏁 Ollama Model Benchmark")
    print("="*80 + "\n")
    
    results = {}
    
    for test_name, prompt in TEST_PROMPTS:
        print(f"\n📝 Test: {test_name}")
        print(f"   Prompt: {prompt[:50]}...")
        print()
        
        for model_name, model in models:
            result = await benchmark_model(model, prompt)
            
            if result["success"]:
                print(f"   {model_name:15} {result['time_ms']:5}ms  "
                      f"{result['tokens']:3} tokens  "
                      f"{result['tokens_per_sec']:.1f} tok/s")
                
                # Store for summary
                if model_name not in results:
                    results[model_name] = []
                results[model_name].append(result["time_ms"])
            else:
                print(f"   {model_name:15} ❌ {result.get('error', 'Failed')}")
    
    # Summary
    print("\n" + "="*80)
    print("📊 Summary")
    print("="*80 + "\n")
    
    for model_name, times in results.items():
        if times:
            avg = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            print(f"{model_name:15}")
            print(f"  Average: {avg:6.0f}ms")
            print(f"  Min:     {min_time:6.0f}ms")
            print(f"  Max:     {max_time:6.0f}ms")
            print()
    
    # Comparison
    if len(results) == 2:
        fast_avg = sum(results["Fast (7B)"]) / len(results["Fast (7B)"])
        smart_avg = sum(results["Smart (32K)"]) / len(results["Smart (32K)"])
        speedup = smart_avg / fast_avg
        
        print(f"🎯 Result: Fast model is {speedup:.1f}x faster for quick tasks")
        print(f"💡 Recommendation: Use smart routing to get best of both!\n")

async def main():
    """Main entry point"""
    # Check if Ollama is running
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.get(f"{OLLAMA_URL}/api/tags")
    except:
        print("\n❌ Error: Ollama is not running on localhost:11434")
        print("   Start with: ollama serve\n")
        return 1
    
    await run_benchmarks()
    return 0

if __name__ == "__main__":
    exit(asyncio.run(main()))


