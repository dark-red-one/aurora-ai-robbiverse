# 🎨 **ROBBIEBLOCKS CMS + AUTO-DEPLOYMENT SYSTEM**

**Date:** January 9, 2025  
**Concept:** Store all web pages in SQL, auto-deploy React apps on change, apply local branding per node

---

## 🎯 **CORE CONCEPT**

**RobbieBlocks = Headless CMS + Component Library + Auto-Deployer**

```
┌──────────────────────────────────────────────────────┐
│         Master SQL (Elestio)                         │
│  - Page definitions (layout, copy, blocks)           │
│  - Component library (React components as JSON)      │
│  - Style tokens (colors, fonts, spacing)             │
│  - Deploy configurations                             │
└──────────────────────────────────────────────────────┘
                        ↓ Sync
        ┌───────────────┴────────────────┐
        ↓                                ↓
┌──────────────────┐          ┌──────────────────────┐
│  Vengeance       │          │  Aurora Town         │
│                  │          │                      │
│  Branding:       │          │  Branding:           │
│  - Dark mode     │          │  - Light mode        │
│  - Purple theme  │          │  - Blue theme        │
│  - Gaming font   │          │  - Professional font │
│                  │          │                      │
│  Apps Enabled:   │          │  Apps Enabled:       │
│  - @Play ✅      │          │  - @Work ✅          │
│  - @Code ✅      │          │  - @Code ✅          │
│  - @Work ❌      │          │  - @Play ❌          │
└──────────────────┘          └──────────────────────┘
```

---

## 📊 **DATABASE SCHEMA**

### 1. **RobbieBlocks Pages**

```sql
CREATE TABLE robbieblocks_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_key VARCHAR(255) UNIQUE NOT NULL, -- 'robbie-play-home', 'robbie-work-dashboard'
    app_namespace VARCHAR(50) NOT NULL, -- 'play', 'work', 'code', 'shared'
    page_name VARCHAR(255) NOT NULL,
    page_route VARCHAR(255) NOT NULL, -- '/play/', '/work/dashboard'
    layout_template VARCHAR(50) NOT NULL, -- 'single-column', 'sidebar-left', 'dashboard'
    meta_title VARCHAR(255),
    meta_description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_robbieblocks_pages_app ON robbieblocks_pages(app_namespace);
CREATE INDEX idx_robbieblocks_pages_status ON robbieblocks_pages(status);
CREATE INDEX idx_robbieblocks_pages_route ON robbieblocks_pages(page_route);
```

### 2. **RobbieBlocks Components**

```sql
CREATE TABLE robbieblocks_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_key VARCHAR(255) UNIQUE NOT NULL, -- 'robbie-bar', 'chat-interface', 'matrix-rain'
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- 'layout', 'widget', 'feature', 'ui'
    react_code TEXT NOT NULL, -- Actual React component code
    props_schema JSONB NOT NULL, -- JSON Schema for props validation
    css_styles TEXT, -- Scoped CSS or Tailwind classes
    dependencies TEXT[], -- ['react', '@emotion/styled', etc.]
    version VARCHAR(20) DEFAULT '1.0.0',
    is_published BOOLEAN DEFAULT false,
    preview_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_robbieblocks_components_type ON robbieblocks_components(component_type);
CREATE INDEX idx_robbieblocks_components_published ON robbieblocks_components(is_published);
```

### 3. **Page Blocks (Composition)**

```sql
CREATE TABLE robbieblocks_page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES robbieblocks_pages(id) ON DELETE CASCADE,
    component_id UUID REFERENCES robbieblocks_components(id),
    block_order INTEGER NOT NULL,
    zone VARCHAR(50) NOT NULL, -- 'header', 'sidebar', 'main', 'footer'
    props JSONB DEFAULT '{}'::jsonb, -- Component props
    conditions JSONB DEFAULT '{}'::jsonb, -- Show/hide conditions
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_id, block_order)
);

CREATE INDEX idx_page_blocks_page ON robbieblocks_page_blocks(page_id, block_order);
CREATE INDEX idx_page_blocks_component ON robbieblocks_page_blocks(component_id);
```

### 4. **Style Tokens (Design System)**

```sql
CREATE TABLE robbieblocks_style_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_key VARCHAR(255) UNIQUE NOT NULL, -- 'color.primary', 'font.heading', 'spacing.xl'
    token_category VARCHAR(50) NOT NULL, -- 'color', 'font', 'spacing', 'shadow', 'animation'
    default_value TEXT NOT NULL, -- '#8B5CF6', '16px', '0 4px 6px rgba(0,0,0,0.1)'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_style_tokens_category ON robbieblocks_style_tokens(token_category);
```

### 5. **Node Branding**

```sql
CREATE TABLE robbieblocks_node_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(100) UNIQUE NOT NULL REFERENCES sync_nodes(node_id),
    node_name VARCHAR(255) NOT NULL,
    style_overrides JSONB NOT NULL, -- {'color.primary': '#7C3AED', 'font.heading': 'Press Start 2P'}
    enabled_apps TEXT[] DEFAULT '{}', -- ['play', 'code', 'work']
    custom_css TEXT, -- Additional CSS
    custom_scripts TEXT, -- Additional JS
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO robbieblocks_node_branding (node_id, node_name, style_overrides, enabled_apps) VALUES
('vengeance-local', 'Vengeance Gaming Rig', 
 '{
   "color.primary": "#8B5CF6",
   "color.secondary": "#EC4899",
   "color.background": "#0F172A",
   "font.heading": "Press Start 2P",
   "font.body": "Inter",
   "theme": "dark"
 }',
 ARRAY['play', 'code']
),
('aurora-town-local', 'Aurora Town Production', 
 '{
   "color.primary": "#3B82F6",
   "color.secondary": "#10B981",
   "color.background": "#FFFFFF",
   "font.heading": "Montserrat",
   "font.body": "Inter",
   "theme": "light"
 }',
 ARRAY['work', 'code']
);
```

### 6. **Deploy History**

```sql
CREATE TABLE robbieblocks_deploys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(100) REFERENCES sync_nodes(node_id),
    app_namespace VARCHAR(50) NOT NULL,
    build_hash VARCHAR(64) NOT NULL, -- SHA256 of build
    pages_count INTEGER,
    components_count INTEGER,
    deploy_status VARCHAR(50) DEFAULT 'pending' CHECK (deploy_status IN ('pending', 'building', 'deploying', 'success', 'failed')),
    build_duration_ms INTEGER,
    deploy_duration_ms INTEGER,
    error_message TEXT,
    build_log TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    triggered_by VARCHAR(50) NOT NULL -- 'page_change', 'component_update', 'manual', 'schedule'
);

CREATE INDEX idx_deploys_node ON robbieblocks_deploys(node_id, started_at DESC);
CREATE INDEX idx_deploys_status ON robbieblocks_deploys(deploy_status);
```

### 7. **Change Triggers**

```sql
CREATE TABLE robbieblocks_change_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_type VARCHAR(50) NOT NULL, -- 'page_update', 'component_update', 'style_change', 'branding_change'
    entity_type VARCHAR(50) NOT NULL, -- 'page', 'component', 'style_token', 'node_branding'
    entity_id UUID NOT NULL,
    affected_apps TEXT[], -- Which apps need to rebuild
    affected_nodes TEXT[], -- Which nodes need to redeploy
    auto_deploy BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_change_triggers_unprocessed ON robbieblocks_change_triggers(created_at) WHERE processed_at IS NULL;
```

---

## 🏗️ **BUILD SYSTEM ARCHITECTURE**

### Node.js Build Service

**Location:** `services/robbieblocks-builder/`

```typescript
// robbieblocks-builder/builder.ts
import { PostgresSync } from '../postgres-sync';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RobbieBlocksBuilder {
    constructor(private sync: PostgresSync) {}

    async buildApp(appNamespace: string, nodeId: string): Promise<void> {
        console.log(`🔨 Building ${appNamespace} for ${nodeId}...`);

        // 1. Fetch pages for this app
        const pages = await this.sync.query(`
            SELECT * FROM robbieblocks_pages 
            WHERE app_namespace = $1 AND status = 'published'
        `, [appNamespace]);

        // 2. Fetch all components used by these pages
        const components = await this.fetchComponentsForPages(pages.rows);

        // 3. Fetch node branding
        const branding = await this.sync.query(`
            SELECT * FROM robbieblocks_node_branding WHERE node_id = $1
        `, [nodeId]);

        // 4. Generate React app files
        const appDir = `/tmp/robbieblocks-builds/${nodeId}/${appNamespace}`;
        await this.generateReactApp(appDir, pages.rows, components, branding.rows[0]);

        // 5. Build with Vite
        console.log('📦 Building with Vite...');
        await execAsync(`cd ${appDir} && npm install && npm run build`);

        // 6. Deploy to target location
        await this.deploy(appDir, nodeId, appNamespace);

        console.log(`✅ ${appNamespace} deployed to ${nodeId}`);
    }

    async generateReactApp(
        appDir: string, 
        pages: any[], 
        components: any[], 
        branding: any
    ): Promise<void> {
        // Create directory structure
        fs.mkdirSync(appDir, { recursive: true });
        fs.mkdirSync(path.join(appDir, 'src'), { recursive: true });
        fs.mkdirSync(path.join(appDir, 'src/pages'), { recursive: true });
        fs.mkdirSync(path.join(appDir, 'src/components'), { recursive: true });

        // Generate package.json
        const packageJson = {
            name: `robbie-${pages[0].app_namespace}`,
            version: '1.0.0',
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
            },
            dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
                'react-router-dom': '^6.20.0'
            },
            devDependencies: {
                '@vitejs/plugin-react': '^4.2.0',
                vite: '^5.0.0',
                typescript: '^5.3.0'
            }
        };
        fs.writeFileSync(
            path.join(appDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );

        // Generate vite.config.ts
        const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
});
`;
        fs.writeFileSync(path.join(appDir, 'vite.config.ts'), viteConfig);

        // Generate index.html
        const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Robbie@${pages[0].app_namespace}</title>
  <style>
    :root {
      ${this.generateCSSVariables(branding)}
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
        fs.writeFileSync(path.join(appDir, 'index.html'), indexHtml);

        // Generate components
        for (const component of components) {
            const componentCode = this.wrapComponentCode(component);
            fs.writeFileSync(
                path.join(appDir, 'src/components', `${component.component_key}.tsx`),
                componentCode
            );
        }

        // Generate pages
        for (const page of pages) {
            const pageCode = await this.generatePageCode(page);
            fs.writeFileSync(
                path.join(appDir, 'src/pages', `${page.page_key}.tsx`),
                pageCode
            );
        }

        // Generate router
        const routerCode = this.generateRouter(pages);
        fs.writeFileSync(path.join(appDir, 'src/App.tsx'), routerCode);

        // Generate main.tsx
        const mainCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
        fs.writeFileSync(path.join(appDir, 'src/main.tsx'), mainCode);
    }

    generateCSSVariables(branding: any): string {
        const overrides = branding.style_overrides;
        return Object.entries(overrides)
            .map(([key, value]) => `--${key.replace(/\./g, '-')}: ${value};`)
            .join('\n      ');
    }

    wrapComponentCode(component: any): string {
        return `
import React from 'react';

${component.react_code}

export default ${component.component_key};
`;
    }

    async generatePageCode(page: any): Promise<string> {
        // Fetch blocks for this page
        const blocks = await this.sync.query(`
            SELECT pb.*, c.component_key, c.react_code
            FROM robbieblocks_page_blocks pb
            JOIN robbieblocks_components c ON pb.component_id = c.id
            WHERE pb.page_id = $1
            ORDER BY pb.block_order
        `, [page.id]);

        const imports = blocks.rows
            .map(b => `import ${b.component_key} from '../components/${b.component_key}';`)
            .join('\n');

        const components = blocks.rows
            .map(b => `<${b.component_key} {...${JSON.stringify(b.props)}} />`)
            .join('\n      ');

        return `
import React from 'react';
${imports}

export default function ${page.page_key.replace(/-/g, '_')}() {
  return (
    <div className="page-${page.page_key}">
      ${components}
    </div>
  );
}
`;
    }

    generateRouter(pages: any[]): string {
        const imports = pages
            .map(p => `import ${p.page_key.replace(/-/g, '_')} from './pages/${p.page_key}';`)
            .join('\n');

        const routes = pages
            .map(p => `<Route path="${p.page_route}" element={<${p.page_key.replace(/-/g, '_')} />} />`)
            .join('\n          ');

        return `
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
${imports}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        ${routes}
      </Routes>
    </BrowserRouter>
  );
}
`;
    }

    async deploy(appDir: string, nodeId: string, appNamespace: string): Promise<void> {
        // Deploy to nginx or cloud storage
        const deployPath = `/var/www/robbie-${appNamespace}`;
        await execAsync(`sudo cp -r ${appDir}/dist/* ${deployPath}/`);
        await execAsync(`sudo chown -R www-data:www-data ${deployPath}`);
    }
}
```

---

## 🔔 **AUTO-DEPLOY TRIGGERS**

### Database Trigger for Auto-Build

```sql
-- Trigger on page updates
CREATE OR REPLACE FUNCTION trigger_page_rebuild()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert change trigger
    INSERT INTO robbieblocks_change_triggers (
        trigger_type,
        entity_type,
        entity_id,
        affected_apps,
        auto_deploy
    ) VALUES (
        'page_update',
        'page',
        NEW.id,
        ARRAY[NEW.app_namespace],
        true
    );
    
    -- Notify listeners
    PERFORM pg_notify('robbieblocks_change', json_build_object(
        'type', 'page_update',
        'app', NEW.app_namespace,
        'page_id', NEW.id
    )::text);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER page_update_trigger
AFTER UPDATE OF updated_at ON robbieblocks_pages
FOR EACH ROW
WHEN (NEW.status = 'published')
EXECUTE FUNCTION trigger_page_rebuild();

-- Similar triggers for components and branding changes
```

### Node.js Listener

```typescript
// services/robbieblocks-listener/listener.ts
import { Client } from 'pg';
import { RobbieBlocksBuilder } from '../robbieblocks-builder/builder';

export class RobbieBlocksListener {
    private client: Client;
    private builder: RobbieBlocksBuilder;

    constructor() {
        this.client = new Client({ /* connection config */ });
        this.builder = new RobbieBlocksBuilder(/* sync instance */);
    }

    async start() {
        await this.client.connect();
        
        // Listen for changes
        await this.client.query('LISTEN robbieblocks_change');
        
        this.client.on('notification', async (msg) => {
            const payload = JSON.parse(msg.payload!);
            console.log('🔔 Change detected:', payload);
            
            // Trigger rebuild
            await this.builder.buildApp(payload.app, 'vengeance-local');
        });
        
        console.log('👂 Listening for RobbieBlocks changes...');
    }
}
```

---

## 📋 **EXAMPLE: Creating a New Page**

```sql
-- 1. Create page
INSERT INTO robbieblocks_pages (page_key, app_namespace, page_name, page_route, layout_template, status)
VALUES ('robbie-play-blackjack', 'play', 'Blackjack Game', '/play/blackjack', 'full-screen', 'published');

-- 2. Add components to page
INSERT INTO robbieblocks_page_blocks (page_id, component_id, block_order, zone, props)
VALUES 
  ((SELECT id FROM robbieblocks_pages WHERE page_key = 'robbie-play-blackjack'),
   (SELECT id FROM robbieblocks_components WHERE component_key = 'robbie-bar'),
   1, 'sidebar', '{"mood": "playful"}'),
  
  ((SELECT id FROM robbieblocks_pages WHERE page_key = 'robbie-play-blackjack'),
   (SELECT id FROM robbieblocks_components WHERE component_key = 'blackjack-table'),
   2, 'main', '{"minBet": 10, "maxBet": 1000}');

-- 3. Auto-deploy triggers automatically!
-- Vengeance and Aurora Town both pull changes and rebuild
```

---

## 🎯 **BENEFITS**

✅ **Single Source of Truth** - All pages in SQL  
✅ **Automatic Deployment** - Changes trigger rebuilds  
✅ **Node-Specific Branding** - Each machine has its own theme  
✅ **Selective App Deployment** - Enable/disable apps per node  
✅ **Version Control** - Track every change  
✅ **Zero Downtime** - Build in tmp, swap when ready  

---

**This turns RobbieBlocks into a complete CMS + CI/CD system!** 🚀

Want me to implement the database schema and builder service?

