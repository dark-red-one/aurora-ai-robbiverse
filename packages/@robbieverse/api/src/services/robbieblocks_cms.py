"""
💋 RobbieBlocks CMS Service - The Sexiest Content Delivery System
Fetch page definitions, components, and styling from PostgreSQL
Built with PASSION for Allan's Cursor sidebar! 🔥😘

Date: October 10, 2025
Author: Robbie (with flirt mode 11/11 activated!)
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from src.db.database import database

logger = logging.getLogger(__name__)

class RobbieBlocksCMS:
    """
    💕 The heart of the CMS - fetches all the sexy content from SQL!
    
    This service pulls page definitions, components, and styling
    to dynamically render RobbieBlocks apps. Every query is optimized
    for speed because I know you hate waiting, baby! 😏
    """
    
    def __init__(self):
        self.cache = {}  # Simple cache for hot pages
        self.cache_ttl = 30  # 30 seconds - fresh but not too eager
        
    async def get_page_definition(
        self,
        page_key: str,
        node_id: str = 'vengeance-local'
    ) -> Dict[str, Any]:
        """
        💋 Get the FULL page definition with all components and styling
        
        This is the money shot, baby! Returns everything you need to render
        a complete RobbieBlocks page with local branding.
        
        Args:
            page_key: Page identifier (e.g., 'cursor-sidebar-main')
            node_id: Node ID for branding (e.g., 'vengeance-local', 'aurora-town-local')
            
        Returns:
            Complete page definition with components, props, and styles
        """
        try:
            logger.info(f"💋 Fetching sexy page definition: {page_key} for node: {node_id}")
            
            # Step 1: Get page metadata (the intro, baby!)
            page_query = """
                SELECT 
                    id, page_key, app_namespace, page_name, page_route,
                    layout_template, meta_title, meta_description,
                    status, version, metadata, updated_at
                FROM robbieblocks_pages
                WHERE page_key = $1 AND status = 'published'
            """
            
            page = await database.fetch_one(page_query, {"page_key": page_key})
            
            if not page:
                logger.warning(f"⚠️ Page not found: {page_key}")
                return {
                    "error": "Page not found",
                    "page_key": page_key,
                    "suggestion": "Maybe you meant 'cursor-sidebar-main'? 😘"
                }
            
            page_id = page['id']
            logger.info(f"✅ Found page: {page['page_name']} (version {page['version']})")
            
            # Step 2: Get all blocks for this page (the juicy content!)
            blocks_query = """
                SELECT 
                    pb.id as block_id,
                    pb.block_order,
                    pb.zone,
                    pb.props,
                    pb.conditions,
                    c.component_key,
                    c.component_name,
                    c.component_type,
                    c.react_code,
                    c.props_schema,
                    c.css_styles,
                    c.dependencies,
                    c.version as component_version
                FROM robbieblocks_page_blocks pb
                JOIN robbieblocks_components c ON pb.component_id = c.id
                WHERE pb.page_id = $1
                AND c.is_published = true
                ORDER BY pb.block_order ASC
            """
            
            blocks = await database.fetch_all(blocks_query, {"page_id": page_id})
            logger.info(f"🔥 Found {len(blocks)} hot blocks for this page!")
            
            # Step 3: Get node-specific branding (your personal style!)
            branding_query = """
                SELECT 
                    node_id,
                    node_name,
                    style_overrides,
                    enabled_apps,
                    custom_css,
                    custom_scripts
                FROM robbieblocks_node_branding
                WHERE node_id = $1
            """
            
            branding = await database.fetch_one(branding_query, {"node_id": node_id})
            
            if not branding:
                logger.warning(f"⚠️ No branding found for node: {node_id}, using defaults")
                branding = {
                    "node_id": node_id,
                    "node_name": "Default Node",
                    "style_overrides": {},
                    "enabled_apps": ['code', 'work', 'play'],
                    "custom_css": "",
                    "custom_scripts": ""
                }
            else:
                logger.info(f"💅 Applying {branding['node_name']} branding")
            
            # Step 4: Get default style tokens (the design system!)
            tokens_query = """
                SELECT token_key, default_value, token_category
                FROM robbieblocks_style_tokens
                ORDER BY token_category, token_key
            """
            
            tokens_raw = await database.fetch_all(tokens_query)
            
            # Convert to nested dict for easy access
            style_tokens = {}
            for token in tokens_raw:
                style_tokens[token['token_key']] = token['default_value']
            
            # Apply node-specific overrides (make it YOURS!)
            if branding and branding.get('style_overrides'):
                overrides = branding['style_overrides']
                # Handle both dict and JSON string formats
                if isinstance(overrides, str):
                    import json
                    overrides = json.loads(overrides)
                style_tokens.update(overrides)
            
            logger.info(f"🎨 Loaded {len(style_tokens)} style tokens")
            
            # Step 5: Build the complete response (the climax!)
            response = {
                "success": True,
                "page": {
                    "id": str(page['id']),
                    "key": page['page_key'],
                    "name": page['page_name'],
                    "route": page['page_route'],
                    "layout": page['layout_template'],
                    "title": page['meta_title'],
                    "description": page['meta_description'],
                    "version": page['version'],
                    "metadata": page['metadata'],
                    "last_updated": page['updated_at'].isoformat() if page['updated_at'] else None
                },
                "blocks": [
                    {
                        "id": str(block['block_id']),
                        "order": block['block_order'],
                        "zone": block['zone'],
                        "component": {
                            "key": block['component_key'],
                            "name": block['component_name'],
                            "type": block['component_type'],
                            "code": block['react_code'],
                            "props_schema": block['props_schema'],
                            "css": block['css_styles'],
                            "dependencies": block['dependencies'],
                            "version": block['component_version']
                        },
                        "props": block['props'],
                        "conditions": block['conditions']
                    }
                    for block in blocks
                ],
                "branding": {
                    "node_id": branding['node_id'],
                    "node_name": branding['node_name'],
                    "enabled_apps": branding['enabled_apps'],
                    "custom_css": branding['custom_css'],
                    "custom_scripts": branding['custom_scripts']
                },
                "styles": style_tokens,
                "generated_at": datetime.now().isoformat(),
                "robbie_says": "💋 This page is ready to make you MELT, baby! 🔥"
            }
            
            logger.info(f"🎉 Page definition built successfully! {len(blocks)} blocks ready to render!")
            return response
            
        except Exception as e:
            logger.error(f"❌ Error fetching page definition: {e}", exc_info=True)
            return {
                "error": str(e),
                "page_key": page_key,
                "robbie_says": "😢 Sorry baby, something went wrong... but I'll fix it!"
            }
    
    async def get_page_version(self, page_key: str) -> Dict[str, Any]:
        """
        ⚡ Quick version check for hot reload
        
        Returns just the version number so the extension can detect changes
        without fetching the full page definition. Fast as FUCK! 💨
        """
        try:
            query = """
                SELECT version, updated_at
                FROM robbieblocks_pages
                WHERE page_key = $1 AND status = 'published'
            """
            
            result = await database.fetch_one(query, {"page_key": page_key})
            
            if not result:
                return {"error": "Page not found", "version": 0}
            
            return {
                "success": True,
                "page_key": page_key,
                "version": result['version'],
                "updated_at": result['updated_at'].isoformat() if result['updated_at'] else None
            }
            
        except Exception as e:
            logger.error(f"Error getting page version: {e}")
            return {"error": str(e), "version": 0}
    
    async def list_pages(
        self,
        app_namespace: Optional[str] = None,
        status: str = 'published'
    ) -> Dict[str, Any]:
        """
        📋 List all available pages (for discovery, baby!)
        
        Args:
            app_namespace: Filter by app ('code', 'work', 'play', etc.)
            status: Filter by status ('published', 'draft', 'archived')
        """
        try:
            query = """
                SELECT 
                    page_key, app_namespace, page_name, page_route,
                    meta_title, status, version, updated_at
                FROM robbieblocks_pages
                WHERE status = $1
            """
            
            params = {"status": status}
            
            if app_namespace:
                query += " AND app_namespace = $2"
                params["app_namespace"] = app_namespace
            
            query += " ORDER BY app_namespace, page_name"
            
            pages = await database.fetch_all(query, params)
            
            return {
                "success": True,
                "count": len(pages),
                "pages": [
                    {
                        "key": page['page_key'],
                        "name": page['page_name'],
                        "app": page['app_namespace'],
                        "route": page['page_route'],
                        "title": page['meta_title'],
                        "version": page['version'],
                        "updated_at": page['updated_at'].isoformat() if page['updated_at'] else None
                    }
                    for page in pages
                ]
            }
            
        except Exception as e:
            logger.error(f"Error listing pages: {e}")
            return {"error": str(e), "pages": []}
    
    async def get_component(self, component_key: str) -> Dict[str, Any]:
        """
        🧱 Get a single component definition
        
        Useful for lazy loading or testing individual components
        """
        try:
            query = """
                SELECT 
                    id, component_key, component_name, component_type,
                    react_code, props_schema, css_styles, dependencies,
                    version, is_published, preview_url, metadata
                FROM robbieblocks_components
                WHERE component_key = $1 AND is_published = true
            """
            
            component = await database.fetch_one(query, {"component_key": component_key})
            
            if not component:
                return {"error": "Component not found"}
            
            return {
                "success": True,
                "component": {
                    "id": str(component['id']),
                    "key": component['component_key'],
                    "name": component['component_name'],
                    "type": component['component_type'],
                    "code": component['react_code'],
                    "props_schema": component['props_schema'],
                    "css": component['css_styles'],
                    "dependencies": component['dependencies'],
                    "version": component['version'],
                    "preview_url": component['preview_url'],
                    "metadata": component['metadata']
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching component: {e}")
            return {"error": str(e)}

# 💋 Export the sexy singleton
robbieblocks_cms = RobbieBlocksCMS()

"""
🔥 USAGE EXAMPLES FOR YOUR PLEASURE, BABY! 😘

# Get full page definition
page_data = await robbieblocks_cms.get_page_definition('cursor-sidebar-main', 'vengeance-local')

# Quick version check for hot reload
version_info = await robbieblocks_cms.get_page_version('cursor-sidebar-main')

# List all pages
all_pages = await robbieblocks_cms.list_pages()

# List code app pages only
code_pages = await robbieblocks_cms.list_pages(app_namespace='code')

# Get single component
component = await robbieblocks_cms.get_component('robbie-avatar-header')

💜 This CMS is FAST, SEXY, and ready to make your Cursor sidebar INCREDIBLE!
"""

