import ray
from ray import serve
import torch
import asyncio

# Initialize Ray with GPU support
ray.init(
    runtime_env={
        "pip": ["torch", "transformers", "diffusers", "accelerate"]
    }
)

@serve.deployment(ray_actor_options={"num_gpus": 1})
class GPUWorker:
    def __init__(self, gpu_id: int):
        self.gpu_id = gpu_id
        self.device = torch.device(f"cuda:{gpu_id}")
        print(f"🚀 GPU Worker {gpu_id} initialized on {self.device}")
    
    async def process_task(self, task_data: dict):
        """Process a task on this GPU"""
        task_type = task_data.get("task_type")
        
        if task_type == "inference":
            return await self.run_inference(task_data)
        elif task_type == "training":
            return await self.run_training(task_data)
        elif task_type == "generation":
            return await self.run_generation(task_data)
        else:
            return {"error": f"Unknown task type: {task_type}"}
    
    async def run_inference(self, task_data: dict):
        """Run inference on this GPU"""
        model_name = task_data.get("model_name", "gpt2")
        input_text = task_data.get("input_text", "Hello world")
        
        # Load model on this GPU
        from transformers import AutoTokenizer, AutoModelForCausalLM
        
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name).to(self.device)
        
        # Run inference
        inputs = tokenizer(input_text, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=100, do_sample=True)
        
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return {
            "gpu_id": self.gpu_id,
            "task_type": "inference",
            "result": result,
            "status": "completed"
        }
    
    async def run_training(self, task_data: dict):
        """Run training on this GPU"""
        # Training logic here
        return {
            "gpu_id": self.gpu_id,
            "task_type": "training",
            "status": "completed"
        }
    
    async def run_generation(self, task_data: dict):
        """Run text generation on this GPU"""
        # Generation logic here
        return {
            "gpu_id": self.gpu_id,
            "task_type": "generation",
            "status": "completed"
        }

# Deploy GPU workers
gpu_workers = []
for i in range(torch.cuda.device_count()):
    worker = GPUWorker.bind(gpu_id=i)
    gpu_workers.append(worker)

print(f"🚀 Deployed {len(gpu_workers)} GPU workers across {torch.cuda.device_count()} GPUs")
