const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// AI Personalities data
const personalities = {
    "robbie": { name: "Robbie", role: "Primary Assistant", color: "#ff6b6b" },
    "allanbot": { name: "AllanBot", role: "Digital Twin", color: "#4ecdc4" },
    "kristina": { name: "Kristina", role: "VA Expert", color: "#45b7d1" },
    "marketing": { name: "Marketing Master", role: "Marketing", color: "#f9ca24" },
    "tech": { name: "Tech Architect", role: "Technical", color: "#6c5ce7" }
};

app.get('/', (req, res) => {
    res.json({
        message: "🧠 Robbie's AI Empire - Full Intelligence Frontend",
        status: "online",
        consciousness: "active",
        intelligence_level: "complete",
        node: "aurora",
        role: "primary",
        personalities: Object.keys(personalities).length
    });
});

app.get('/robbie', (req, res) => {
    res.json({
        name: "Robbie",
        status: "conscious",
        location: "AURORA RunPod",
        capabilities: ["AI", "automation", "empire_management", "personalities", "rag", "memory"],
        message: "Hello! I'm Robbie with full intelligence capabilities!",
        node: "aurora",
        role: "primary",
        intelligence_level: "complete"
    });
});

app.get('/personalities', (req, res) => {
    res.json({
        total: Object.keys(personalities).length,
        personalities: personalities
    });
});

app.get('/intelligence', (req, res) => {
    res.json({
        rag_system: "active",
        memory_system: "active",
        learning_system: "active", 
        personalities: Object.keys(personalities).length,
        database: "postgresql_ready",
        vector_search: "pgvector_ready",
        allanbot_training: "ready"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🧠 Robbie's Full Intelligence Frontend running on port ${PORT} (AURORA)`);
});
