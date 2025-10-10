-- Migration: Convert GroceryShop Landing Page to RobbieBlocks CMS
-- This stores the landing page in PostgreSQL for automatic replication across all town nodes
-- Date: 2025-10-10
-- ============================================

-- 1. Create the page definition
INSERT INTO robbieblocks_pages (
    page_key,
    app_namespace,
    page_name,
    page_route,
    layout_template,
    meta_title,
    meta_description,
    status,
    metadata
) VALUES (
    'testpilot-groceryshop-landing',
    'marketing',
    'GroceryShop 2025 Landing Page',
    '/landing/groceryshop/',
    'single-column',
    'TestPilot at GroceryShop 2025 - Hi {{name}}!',
    'Personalized landing page for GroceryShop conference attendees',
    'published',
    '{"tracking_enabled": true, "personalization": true, "event": "GroceryShop 2025"}'::jsonb
) ON CONFLICT (page_key) DO NOTHING;

-- 2. Create reusable components
-- Component 1: TestPilot Header with Logo
INSERT INTO robbieblocks_components (
    component_key,
    component_name,
    component_type,
    react_code,
    props_schema,
    css_styles,
    dependencies,
    is_published,
    metadata
) VALUES (
    'testpilot-header-groceryshop',
    'TestPilot Header - GroceryShop',
    'layout',
    E'<div className="header">
  <div className="header-content">
    <div className="logo-section">
      <img src="/assets/testpilot/testpilot-logo-light.png" alt="TestPilot" className="testpilot-logo-img" />
    </div>
    <div className="greeting" id="greeting">{props.greeting || "Great connecting at GroceryShop!"}</div>
  </div>
</div>',
    '{"greeting": {"type": "string", "default": "Great connecting at GroceryShop!"}}'::jsonb,
    E'.header {
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
  padding: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo-section {
  display: flex;
  align-items: center;
  gap: 15px;
}
.testpilot-logo-img {
  height: 40px;
  width: auto;
}
.greeting {
  color: white;
  font-size: 16px;
  font-weight: 500;
}',
    ARRAY[]::text[],
    true,
    '{"town_enabled": ["all"]}'::jsonb
) ON CONFLICT (component_key) DO UPDATE SET
  react_code = EXCLUDED.react_code,
  css_styles = EXCLUDED.css_styles,
  updated_at = NOW();

-- Component 2: Allan Sidebar CTA
INSERT INTO robbieblocks_components (
    component_key,
    component_name,
    component_type,
    react_code,
    props_schema,
    css_styles,
    dependencies,
    is_published,
    metadata
) VALUES (
    'allan-sidebar-cta',
    'Allan Peretz CTA Sidebar',
    'widget',
    E'<div className="allan-bar">
  <img src="/assets/testpilot/allan-peretz.jpg" alt="Allan Peretz" className="allan-photo" />
  <div className="allan-name">Allan Peretz</div>
  <div className="allan-title">CEO & Co-Founder</div>
  <div className="action-buttons">
    <a href="https://calendly.com/allan-testpilotcpg/30min" className="testpilot-btn testpilot-btn-primary" target="_blank">📅 Book Meeting</a>
    <a href="mailto:allan@testpilotcpg.com" className="testpilot-btn testpilot-btn-secondary">✉️ Email Allan</a>
    <a href="https://www.linkedin.com/in/afperetz/" className="testpilot-btn testpilot-btn-secondary" target="_blank">💼 LinkedIn</a>
  </div>
</div>',
    '{}'::jsonb,
    E'.allan-bar {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  text-align: center;
  position: sticky;
  top: 110px;
  height: fit-content;
}
.allan-photo {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  margin: 0 auto 20px;
  display: block;
  object-fit: cover;
}
.allan-name {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 5px;
  color: #1a1a1a;
}
.allan-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}',
    ARRAY[]::text[],
    true,
    '{"town_enabled": ["all"]}'::jsonb
) ON CONFLICT (component_key) DO UPDATE SET
  react_code = EXCLUDED.react_code,
  css_styles = EXCLUDED.css_styles,
  updated_at = NOW();

-- Component 3: Robbie Popup (Conversion Widget)
INSERT INTO robbieblocks_components (
    component_key,
    component_name,
    component_type,
    react_code,
    props_schema,
    css_styles,
    dependencies,
    is_published,
    metadata
) VALUES (
    'robbie-popup-cta',
    'Robbie Conversion Popup',
    'widget',
    E'<div id="robbie-popup" className="robbie-popup-container">
  <div className="robbie-popup-header">
    <span>👋 Hi there!</span>
    <button className="robbie-popup-close">&times;</button>
  </div>
  <div className="robbie-popup-body">
    <img src="/packages/@robbieblocks/assets/avatars/robbie-friendly.png" alt="Robbie Avatar" className="robbie-avatar" />
    <p className="robbie-message">
      Hi, I\'m Robbie, TestPilot\'s assistant. We\'d love to meet. How about next week sometime?
    </p>
  </div>
  <div className="robbie-popup-actions">
    <a href="https://calendly.com/allan-testpilotcpg/30min" target="_blank" className="robbie-popup-btn primary" data-conversion-type="calendly_book_demo" data-conversion-value="150">📅 Book Demo</a>
    <a href="https://calendly.com/allan-testpilotcpg/30min" target="_blank" className="robbie-popup-btn secondary" data-conversion-type="calendly_strategy_call" data-conversion-value="120">💡 Book Strategy Call</a>
    <a href="#" className="robbie-popup-btn outline" data-conversion-type="prepare_nda" data-conversion-value="100">📄 Prepare NDA</a>
  </div>
</div>',
    '{"delay_seconds": {"type": "number", "default": 10}, "message": {"type": "string", "default": "Hi, I\'m Robbie, TestPilot\'s assistant. We\'d love to meet. How about next week sometime?"}}'::jsonb,
    E'.robbie-popup-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  font-family: "Inter", sans-serif;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  transition: transform 0.5s ease-out;
}
.robbie-popup-container.show {
  transform: translateY(0);
}
.robbie-popup-header {
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-weight: 600;
  border-radius: 12px 12px 0 0;
}',
    ARRAY[]::text[],
    true,
    '{"town_enabled": ["all"], "conversion_tracking": true}'::jsonb
) ON CONFLICT (component_key) DO UPDATE SET
  react_code = EXCLUDED.react_code,
  css_styles = EXCLUDED.css_styles,
  updated_at = NOW();

-- Component 4: Main Content Section
INSERT INTO robbieblocks_components (
    component_key,
    component_name,
    component_type,
    react_code,
    props_schema,
    css_styles,
    dependencies,
    is_published,
    metadata
) VALUES (
    'groceryshop-main-content',
    'GroceryShop Landing Main Content',
    'feature',
    E'<div className="main-content">
  <div className="section hero-section">
    <h1 className="hero-title">Hi {props.visitorName || "there"}! 👋</h1>
    <p className="hero-subtitle">Great connecting at <span className="event-highlight">GroceryShop 2025</span></p>
    <p className="intro-text">TestPilot helps CPG brands <strong>validate products before launch</strong> with real shopper feedback.</p>
  </div>

  <div className="section value-props">
    <div className="value-card">
      <div className="icon">🎯</div>
      <h3>Test Before Launch</h3>
      <p>Get real shopper feedback on pricing, packaging, and claims before you spend $$$$ on production.</p>
    </div>
    <div className="value-card">
      <div className="icon">⚡</div>
      <h3>Ship Faster</h3>
      <p>Launch with confidence knowing your product will resonate with shoppers.</p>
    </div>
    <div className="value-card">
      <div className="icon">💰</div>
      <h3>Save Money</h3>
      <p>Avoid costly mistakes and optimize before manufacturing.</p>
    </div>
  </div>

  <div className="section testimonial-section">
    <blockquote className="testimonial">
      <p>"TestPilot helped us refine our packaging and pricing before launch. The insights were invaluable!"</p>
      <cite>— CPG Founder, GroceryShop 2024</cite>
    </blockquote>
  </div>

  <div className="section how-it-works">
    <h2>How It Works</h2>
    <div className="steps">
      <div className="step">
        <div className="step-number">1</div>
        <h4>Upload Your Product</h4>
        <p>Add your product details, images, and test scenarios</p>
      </div>
      <div className="step">
        <div className="step-number">2</div>
        <h4>We Recruit Shoppers</h4>
        <p>Real target consumers see your product</p>
      </div>
      <div className="step">
        <div className="step-number">3</div>
        <h4>Get Insights</h4>
        <p>AI-powered analysis of shopper feedback</p>
      </div>
      <div className="step">
        <div className="step-number">4</div>
        <h4>Launch with Confidence</h4>
        <p>Make data-driven decisions</p>
      </div>
    </div>
  </div>

  <div className="section faq-section">
    <h2>FAQ</h2>
    <div className="faq-item">
      <div className="faq-question">How much does it cost?</div>
      <div className="faq-answer">Starting at $500 per test. Credit-based pricing for flexibility.</div>
    </div>
    <div className="faq-item">
      <div className="faq-question">How long does testing take?</div>
      <div className="faq-answer">Most tests complete within 48-72 hours.</div>
    </div>
    <div className="faq-item">
      <div className="faq-question">Who are your beta customers?</div>
      <div className="faq-answer">Beta testers included Cholula, Modica, and Shaz & Kiks.</div>
    </div>
  </div>
</div>',
    '{"visitorName": {"type": "string", "default": "there"}, "companyName": {"type": "string", "default": ""}}'::jsonb,
    E'.main-content {
  flex: 1;
  max-width: 800px;
}
.section {
  background: white;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.hero-title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}',
    ARRAY[]::text[],
    true,
    '{"town_enabled": ["all"]}'::jsonb
) ON CONFLICT (component_key) DO UPDATE SET
  react_code = EXCLUDED.react_code,
  css_styles = EXCLUDED.css_styles,
  updated_at = NOW();

-- 3. Compose the page from components
-- Get the page_id
DO $$
DECLARE
    v_page_id UUID;
    v_header_id UUID;
    v_sidebar_id UUID;
    v_popup_id UUID;
    v_content_id UUID;
BEGIN
    SELECT id INTO v_page_id FROM robbieblocks_pages WHERE page_key = 'testpilot-groceryshop-landing';
    SELECT id INTO v_header_id FROM robbieblocks_components WHERE component_key = 'testpilot-header-groceryshop';
    SELECT id INTO v_sidebar_id FROM robbieblocks_components WHERE component_key = 'allan-sidebar-cta';
    SELECT id INTO v_popup_id FROM robbieblocks_components WHERE component_key = 'robbie-popup-cta';
    SELECT id INTO v_content_id FROM robbieblocks_components WHERE component_key = 'groceryshop-main-content';

    -- Add header
    INSERT INTO robbieblocks_page_blocks (page_id, component_id, block_order, zone, props)
    VALUES (v_page_id, v_header_id, 1, 'header', '{}'::jsonb)
    ON CONFLICT (page_id, block_order) DO NOTHING;

    -- Add main content
    INSERT INTO robbieblocks_page_blocks (page_id, component_id, block_order, zone, props)
    VALUES (v_page_id, v_content_id, 2, 'main', '{"visitorName": "{{name}}", "companyName": "{{company}}"}'::jsonb)
    ON CONFLICT (page_id, block_order) DO NOTHING;

    -- Add sidebar
    INSERT INTO robbieblocks_page_blocks (page_id, component_id, block_order, zone, props)
    VALUES (v_page_id, v_sidebar_id, 3, 'sidebar', '{}'::jsonb)
    ON CONFLICT (page_id, block_order) DO NOTHING;

    -- Add popup
    INSERT INTO robbieblocks_page_blocks (page_id, component_id, block_order, zone, props)
    VALUES (v_page_id, v_popup_id, 4, 'overlay', '{"delay_seconds": 10}'::jsonb)
    ON CONFLICT (page_id, block_order) DO NOTHING;
END $$;

-- 4. Create node-specific branding (all towns use same branding for this page)
INSERT INTO robbieblocks_node_branding (
    node_name,
    page_id,
    brand_colors,
    custom_css
) 
SELECT 
    'all_towns',
    id,
    '{"primary": "#4ECDC4", "secondary": "#44A08D", "accent": "#F76C6C"}'::jsonb,
    '@import url("/assets/testpilot/brand.css");'
FROM robbieblocks_pages WHERE page_key = 'testpilot-groceryshop-landing'
ON CONFLICT (node_name, page_id) DO NOTHING;

-- 5. Trigger auto-deployment
INSERT INTO robbieblocks_change_triggers (
    trigger_type,
    target_type,
    target_id,
    change_summary
)
SELECT 
    'page_updated',
    'page',
    id,
    'GroceryShop landing page migrated to RobbieBlocks CMS'
FROM robbieblocks_pages WHERE page_key = 'testpilot-groceryshop-landing';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ GroceryShop landing page successfully migrated to RobbieBlocks!';
    RAISE NOTICE '📊 Page will now replicate to all town nodes automatically';
    RAISE NOTICE '🔄 Auto-deploy triggered - check robbieblocks_deploys table for status';
END $$;

