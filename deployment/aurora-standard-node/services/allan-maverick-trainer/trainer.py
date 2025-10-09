#!/usr/bin/env python3
"""
Allan Maverick Model Trainer
Continuous fine-tuning of Allan's digital twin using real data
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Allan Maverick Trainer")

# Configuration
NODE_NAME = os.getenv("NODE_NAME", "unknown")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

BASE_MODEL = os.getenv("BASE_MODEL", "meta-llama/Llama-2-7b-chat-hf")
TRAINING_DATA_DIR = os.getenv("TRAINING_DATA_DIR", "/data/training")
MODEL_OUTPUT_DIR = os.getenv("MODEL_OUTPUT_DIR", "/models/allan-maverick")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        cursor_factory=RealDictCursor
    )


class TrainingConfig(BaseModel):
    """Training configuration"""
    epochs: int = 3
    learning_rate: float = 2e-4
    batch_size: int = 4
    max_length: int = 512
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    warmup_steps: int = 100
    save_steps: int = 500


class AllanMaverickTrainer:
    """Trains Allan's digital twin model"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.model = None
        self.tokenizer = None
        self.training_data = []
        
    async def collect_training_data(self):
        """Collect training data from multiple sources"""
        logger.info("📊 Collecting training data for Allan Maverick...")
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # 1. Emails (Allan's writing style)
                cur.execute("""
                    SELECT 
                        subject,
                        body,
                        sent_at
                    FROM crm_emails
                    WHERE sender_email LIKE '%allan%'
                    ORDER BY sent_at DESC
                    LIMIT 1000
                """)
                emails = cur.fetchall()
                
                for email in emails:
                    self.training_data.append({
                        "instruction": f"Write an email about: {email['subject']}",
                        "input": "",
                        "output": email['body'],
                        "source": "email",
                        "timestamp": email['sent_at']
                    })
                
                # 2. Conversations (Allan's decision-making)
                cur.execute("""
                    SELECT 
                        m.content,
                        m.role,
                        c.metadata
                    FROM messages m
                    JOIN conversations c ON m.conversation_id = c.id
                    WHERE c.user_id = 'allan'
                    AND m.role = 'user'
                    ORDER BY m.created_at DESC
                    LIMIT 5000
                """)
                conversations = cur.fetchall()
                
                for conv in conversations:
                    self.training_data.append({
                        "instruction": "Respond as Allan would:",
                        "input": conv['content'],
                        "output": "",  # Will be filled with actual responses
                        "source": "conversation",
                        "timestamp": datetime.now()
                    })
                
                # 3. Deals (Allan's business decisions)
                cur.execute("""
                    SELECT 
                        deal_name,
                        stage,
                        amount,
                        notes
                    FROM crm_deals
                    WHERE owner_email LIKE '%allan%'
                    ORDER BY created_at DESC
                    LIMIT 500
                """)
                deals = cur.fetchall()
                
                for deal in deals:
                    self.training_data.append({
                        "instruction": f"Make a business decision about: {deal['deal_name']}",
                        "input": f"Stage: {deal['stage']}, Amount: ${deal['amount']}",
                        "output": deal['notes'] or "",
                        "source": "deal",
                        "timestamp": datetime.now()
                    })
                
                # 4. Sticky Notes (Allan's thoughts and insights)
                cur.execute("""
                    SELECT 
                        title,
                        content,
                        tags,
                        created_at
                    FROM sticky_notes
                    WHERE user_id = 'allan'
                    ORDER BY created_at DESC
                    LIMIT 2000
                """)
                notes = cur.fetchall()
                
                for note in notes:
                    self.training_data.append({
                        "instruction": f"Share insights about: {note['title']}",
                        "input": "",
                        "output": note['content'],
                        "source": "sticky_note",
                        "timestamp": note['created_at']
                    })
                
                logger.info(f"✅ Collected {len(self.training_data)} training examples")
                
        finally:
            conn.close()
    
    def prepare_dataset(self):
        """Prepare dataset for training"""
        logger.info("🔄 Preparing dataset...")
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(self.training_data)
        
        # Filter out empty outputs
        df = df[df['output'].str.len() > 10]
        
        # Create prompt-completion pairs
        df['text'] = df.apply(lambda row: 
            f"### Instruction: {row['instruction']}\n"
            f"### Input: {row['input']}\n"
            f"### Response: {row['output']}\n",
            axis=1
        )
        
        # Convert to HuggingFace Dataset
        dataset = Dataset.from_pandas(df[['text']])
        
        # Split into train/val
        dataset = dataset.train_test_split(test_size=0.1)
        
        logger.info(f"✅ Dataset prepared: {len(dataset['train'])} train, {len(dataset['test'])} val")
        
        return dataset
    
    def load_model(self):
        """Load base model and prepare for LoRA fine-tuning"""
        logger.info(f"🤖 Loading base model: {BASE_MODEL}...")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model with 4-bit quantization
        self.model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            load_in_4bit=True,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        # Prepare for LoRA
        self.model = prepare_model_for_kbit_training(self.model)
        
        # Configure LoRA
        lora_config = LoraConfig(
            r=self.config.lora_r,
            lora_alpha=self.config.lora_alpha,
            target_modules=["q_proj", "v_proj"],
            lora_dropout=self.config.lora_dropout,
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        # Apply LoRA
        self.model = get_peft_model(self.model, lora_config)
        
        logger.info("✅ Model loaded and prepared for LoRA fine-tuning")
    
    def tokenize_function(self, examples):
        """Tokenize examples"""
        return self.tokenizer(
            examples['text'],
            truncation=True,
            max_length=self.config.max_length,
            padding="max_length"
        )
    
    async def train(self):
        """Train Allan Maverick model"""
        logger.info("🎓 Starting Allan Maverick training...")
        
        # Collect data
        await self.collect_training_data()
        
        # Prepare dataset
        dataset = self.prepare_dataset()
        
        # Tokenize
        tokenized_dataset = dataset.map(
            self.tokenize_function,
            batched=True,
            remove_columns=dataset['train'].column_names
        )
        
        # Load model
        self.load_model()
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=MODEL_OUTPUT_DIR,
            num_train_epochs=self.config.epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            learning_rate=self.config.learning_rate,
            warmup_steps=self.config.warmup_steps,
            logging_steps=10,
            save_steps=self.config.save_steps,
            eval_steps=self.config.save_steps,
            evaluation_strategy="steps",
            save_total_limit=3,
            load_best_model_at_end=True,
            fp16=True,
            gradient_accumulation_steps=4,
            dataloader_num_workers=4,
            report_to="none"
        )
        
        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=tokenized_dataset['train'],
            eval_dataset=tokenized_dataset['test']
        )
        
        # Train
        logger.info("🚀 Training started...")
        trainer.train()
        
        # Save final model
        trainer.save_model(f"{MODEL_OUTPUT_DIR}/final")
        self.tokenizer.save_pretrained(f"{MODEL_OUTPUT_DIR}/final")
        
        logger.info(f"✅ Training complete! Model saved to {MODEL_OUTPUT_DIR}/final")
        
        # Update Redis with training status
        redis_client.set("allan_maverick:last_trained", datetime.now().isoformat())
        redis_client.set("allan_maverick:training_examples", len(self.training_data))
        
        return {
            "status": "completed",
            "training_examples": len(self.training_data),
            "model_path": f"{MODEL_OUTPUT_DIR}/final",
            "timestamp": datetime.now().isoformat()
        }


@app.on_event("startup")
async def startup_event():
    """Initialize Allan Maverick Trainer"""
    logger.info(f"🎓 Starting Allan Maverick Trainer on {NODE_NAME}...")
    logger.info("✅ Allan Maverick Trainer ready")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "allan-maverick-trainer",
        "node": NODE_NAME
    }


@app.post("/api/train")
async def start_training(config: TrainingConfig, background_tasks: BackgroundTasks):
    """Start training Allan Maverick model"""
    try:
        trainer = AllanMaverickTrainer(config)
        
        # Run training in background
        background_tasks.add_task(trainer.train)
        
        return {
            "status": "training_started",
            "config": config.dict(),
            "message": "Allan Maverick training started in background"
        }
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/training/status")
async def get_training_status():
    """Get current training status"""
    try:
        last_trained = redis_client.get("allan_maverick:last_trained")
        training_examples = redis_client.get("allan_maverick:training_examples")
        
        return {
            "last_trained": last_trained,
            "training_examples": int(training_examples) if training_examples else 0,
            "model_available": os.path.exists(f"{MODEL_OUTPUT_DIR}/final")
        }
        
    except Exception as e:
        logger.error(f"❌ Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
