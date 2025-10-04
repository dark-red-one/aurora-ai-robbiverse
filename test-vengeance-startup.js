// Test Vengeance startup
import Fastify from "fastify";

console.log('🚀 Testing Vengeance startup...');

try {
  const app = Fastify({ logger: true });
  
  app.get("/health", async () => ({ 
    status: "ok", 
    time: new Date().toISOString() 
  }));
  
  const port = process.env.PORT || 5055;
  console.log(`🔥 Starting Vengeance on port ${port}...`);
  
  await app.listen({ port, host: "0.0.0.0" });
  console.log('✅ Vengeance started successfully!');
  
} catch (error) {
  console.error('❌ Vengeance startup failed:', error);
  process.exit(1);
}



