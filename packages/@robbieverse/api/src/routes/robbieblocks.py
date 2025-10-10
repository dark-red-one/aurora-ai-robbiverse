"""
RobbieBlocks CMS - Dynamic Page Rendering from PostgreSQL
Serves pages stored in SQL with automatic town-wide replication
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from typing import Optional, Dict, Any
import psycopg2
import os
import logging
from urllib.parse import parse_qs

router = APIRouter()
logger = logging.getLogger(__name__)

# Database connection details
DB_HOST = os.getenv("MASTER_DB_HOST", "localhost")
DB_PORT = os.getenv("MASTER_DB_PORT", "5432")
DB_NAME = os.getenv("MASTER_DB_NAME", "aurora_unified")
DB_USER = os.getenv("MASTER_DB_USER", "postgres")
DB_PASSWORD = os.getenv("MASTER_DB_PASSWORD", "aurora2024")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

def personalize_content(content: str, params: Dict[str, str]) -> str:
    """Replace {{name}}, {{company}} etc with actual values from URL params"""
    for key, value in params.items():
        placeholder = f"{{{{{key}}}}}"
        content = content.replace(placeholder, value)
    return content

@router.get("/robbieblocks/page/{page_route:path}")
async def render_robbieblocks_page(page_route: str, request: Request):
    """
    Render a RobbieBlocks page from PostgreSQL
    
    Example: /robbieblocks/page/landing/groceryshop/?name=Allan&company=TestPilot
    """
    try:
        # Parse query parameters for personalization
        query_params = dict(request.query_params)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get page definition
        cursor.execute("""
            SELECT 
                p.id, p.page_key, p.page_name, p.meta_title, p.meta_description,
                p.layout_template, p.metadata
            FROM robbieblocks_pages p
            WHERE p.page_route = %s AND p.status = 'published'
        """, (f'/{page_route}/',))
        
        page = cursor.fetchone()
        if not page:
            raise HTTPException(status_code=404, detail=f"Page not found: {page_route}")
        
        page_id, page_key, page_name, meta_title, meta_description, layout_template, metadata = page
        
        # Get all components for this page in order
        cursor.execute("""
            SELECT 
                pb.zone, pb.block_order, pb.props,
                c.component_key, c.component_name, c.react_code, c.css_styles, c.metadata
            FROM robbieblocks_page_blocks pb
            JOIN robbieblocks_components c ON pb.component_id = c.id
            WHERE pb.page_id = %s
            ORDER BY pb.block_order
        """, (page_id,))
        
        blocks = cursor.fetchall()
        
        # Get node-specific branding (if exists)
        cursor.execute("""
            SELECT brand_colors, custom_css
            FROM robbieblocks_node_branding
            WHERE page_id = %s AND (node_name = %s OR node_name = 'all_towns')
            LIMIT 1
        """, (page_id, os.getenv('NODE_NAME', 'robbiebook1')))
        
        branding = cursor.fetchone()
        custom_css = branding[1] if branding else ""
        
        cursor.close()
        conn.close()
        
        # Build HTML
        html_parts = {
            'header': [],
            'main': [],
            'sidebar': [],
            'footer': [],
            'overlay': []
        }
        
        css_parts = []
        
        for zone, block_order, props, comp_key, comp_name, react_code, css_styles, comp_metadata in blocks:
            # Personalize content
            personalized_html = personalize_content(react_code, query_params)
            personalized_props = personalize_content(str(props or '{}'), query_params)
            
            html_parts[zone].append(personalized_html)
            if css_styles:
                css_parts.append(css_styles)
        
        # Personalize meta title
        personalized_title = personalize_content(meta_title or page_name, query_params)
        
        # Generate complete HTML
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{personalized_title}</title>
    <meta name="description" content="{meta_description or ''}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {custom_css}
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f7fa;
            color: #1a1a1a;
            line-height: 1.6;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px 20px;
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 30px;
        }}
        @media (max-width: 1024px) {{
            .container {{
                grid-template-columns: 1fr;
            }}
        }}
        {chr(10).join(css_parts)}
    </style>
</head>
<body>
    <!-- Header -->
    {''.join(html_parts['header'])}
    
    <!-- Main Container -->
    <div class="container">
        <!-- Main Content -->
        {''.join(html_parts['main'])}
        
        <!-- Sidebar -->
        {''.join(html_parts['sidebar'])}
    </div>
    
    <!-- Footer -->
    {''.join(html_parts['footer'])}
    
    <!-- Overlay (Popups, etc) -->
    {''.join(html_parts['overlay'])}
    
    <!-- Enhanced Tracking Script with HubSpot Integration 🔥 -->
    <script>
        (function() {{
            // Cookie helpers
            function getCookie(name) {{
                const value = `; ${{document.cookie}}`;
                const parts = value.split(`; ${{name}}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            }}
            
            function setCookie(name, value, days) {{
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                document.cookie = `${{name}}=${{value}};expires=${{date.toUTCString()}};path=/;SameSite=Lax`;
            }}
            
            // Get or create persistent user ID (90-day cookie)
            let userId = getCookie('tp_user_id');
            if (!userId) {{
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
                setCookie('tp_user_id', userId, 90);
            }}
            
            // Session ID (per browser tab)
            let sessionId = sessionStorage.getItem('tracking_session_id');
            if (!sessionId) {{
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
                sessionStorage.setItem('tracking_session_id', sessionId);
            }}

            // Get URL params for identification
            const urlParams = new URLSearchParams(window.location.search);
            const visitorName = urlParams.get('name');
            const visitorCompany = urlParams.get('company');
            const identifiedEmail = urlParams.get('email');
            const hubspotContactId = urlParams.get('hsid');
            const hubspotUtk = getCookie('hubspotutk');
            
            // Store identified info in cookies for future visits
            if (identifiedEmail) {{
                setCookie('tp_email', identifiedEmail, 365);
            }}
            if (hubspotContactId) {{
                setCookie('tp_hsid', hubspotContactId, 365);
            }}

            // Fault-tolerant tracking function
            function track(endpoint, data) {{
                try {{
                    fetch('/api/tracking/' + endpoint, {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{ 
                            session_id: sessionId,
                            user_id: userId,
                            identified_email: identifiedEmail || getCookie('tp_email'),
                            hubspot_contact_id: hubspotContactId || getCookie('tp_hsid'),
                            hubspot_utk: hubspotUtk,
                            ...data 
                        }})
                    }}).catch(() => {{}}); // Silent fail
                }} catch (e) {{}}
            }}

            // Track pageview with full identity
            try {{
                track('pageview', {{
                    page_url: window.location.href,
                    page_title: document.title,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent,
                    visitor_name: visitorName,
                    visitor_company: visitorCompany
                }});
                console.log('🎯 Tracking initialized - User:', userId, 'Email:', identifiedEmail || 'Anonymous');
            }} catch (e) {{}}

            // Heartbeat every 5 seconds
            setInterval(() => {{
                try {{
                    track('heartbeat', {{ seconds: 5 }});
                }} catch (e) {{}}
            }}, 5000);

            // Track scroll depth
            let maxScroll = 0;
            window.addEventListener('scroll', () => {{
                try {{
                    const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
                    if (scrollPercent > maxScroll) {{
                        maxScroll = scrollPercent;
                        if ([25, 50, 75, 100].includes(maxScroll)) {{
                            track('event', {{
                                event_type: 'scroll_depth',
                                event_data: {{ percent: maxScroll }}
                            }});
                        }}
                    }}
                }} catch (e) {{}}
            }});

            // Track tab visibility
            document.addEventListener('visibilitychange', () => {{
                try {{
                    track('event', {{
                        event_type: 'tab_' + (document.hidden ? 'hidden' : 'visible'),
                        event_data: {{ timestamp: Date.now() }}
                    }});
                }} catch (e) {{}}
            }});

            // Track conversions on CTA clicks
            document.addEventListener('click', (e) => {{
                try {{
                    const target = e.target.closest('[data-conversion-type]');
                    if (target) {{
                        const conversionType = target.dataset.conversionType;
                        const conversionValue = parseFloat(target.dataset.conversionValue || 0);
                        track('conversion', {{
                            conversion_type: conversionType,
                            conversion_value: conversionValue,
                            metadata: {{ button_text: target.textContent.trim() }}
                        }});
                    }}
                }} catch (e) {{}}
            }});

            // Send beacon on page exit
            window.addEventListener('beforeunload', () => {{
                try {{
                    navigator.sendBeacon('/api/tracking/heartbeat', JSON.stringify({{
                        session_id: sessionId,
                        seconds: 1
                    }}));
                }} catch (e) {{}}
            }});

            // Robbie Popup Logic
            setTimeout(() => {{
                const popup = document.getElementById('robbie-popup');
                if (popup && !localStorage.getItem('robbie_popup_dismissed')) {{
                    popup.classList.add('show');
                    track('event', {{
                        event_type: 'robbie_popup_shown',
                        event_data: {{ page: '{page_key}' }}
                    }});
                }}
            }}, 10000);

            // Popup close handler
            document.addEventListener('click', (e) => {{
                if (e.target.classList.contains('robbie-popup-close')) {{
                    const popup = document.getElementById('robbie-popup');
                    if (popup) {{
                        popup.classList.remove('show');
                        localStorage.setItem('robbie_popup_dismissed', 'true');
                        track('event', {{
                            event_type: 'robbie_popup_dismissed',
                            event_data: {{}}
                        }});
                    }}
                }}
            }});
        }})();
    </script>
</body>
</html>"""
        
        return HTMLResponse(content=html)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rendering RobbieBlocks page: {e}")
        raise HTTPException(status_code=500, detail=f"Error rendering page: {str(e)}")

@router.get("/robbieblocks/pages")
async def list_robbieblocks_pages():
    """List all published RobbieBlocks pages"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT page_key, page_name, page_route, meta_title, app_namespace, published_at
            FROM robbieblocks_pages
            WHERE status = 'published'
            ORDER BY app_namespace, page_route
        """)
        
        pages = []
        for row in cursor.fetchall():
            pages.append({
                "page_key": row[0],
                "page_name": row[1],
                "page_route": row[2],
                "meta_title": row[3],
                "app_namespace": row[4],
                "published_at": row[5].isoformat() if row[5] else None,
                "url": f"/robbieblocks/page{row[2]}"
            })
        
        cursor.close()
        conn.close()
        
        return {"pages": pages, "total": len(pages)}
        
    except Exception as e:
        logger.error(f"Error listing pages: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing pages: {str(e)}")

@router.get("/robbieblocks/components")
async def list_robbieblocks_components():
    """List all published RobbieBlocks components"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT component_key, component_name, component_type, version, is_published
            FROM robbieblocks_components
            WHERE is_published = true
            ORDER BY component_type, component_name
        """)
        
        components = []
        for row in cursor.fetchall():
            components.append({
                "component_key": row[0],
                "component_name": row[1],
                "component_type": row[2],
                "version": row[3],
                "is_published": row[4]
            })
        
        cursor.close()
        conn.close()
        
        return {"components": components, "total": len(components)}
        
    except Exception as e:
        logger.error(f"Error listing components: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing components: {str(e)}")

