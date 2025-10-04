# RobbieBlocks Widget Catalog

## Implementation Status: INITIALIZED

This directory contains the 20 core widgets that power all 5 RobbieBlocks sites. Each widget follows consistent input/output contracts and can be deployed across multiple sites.

## Widget Architecture

```typescript
interface WidgetProps {
  config: WidgetConfig;
  data?: any;
  onEvent?: (event: WidgetEvent) => void;
  analytics?: AnalyticsTracker;
}
```

## Core Widgets (Priority 1)
- [ ] Vista Hero - Full-bleed landing headers with CTA
- [ ] Chat Widget - Conversational AI interface  
- [ ] Specsheet - Product/platform capability display
- [ ] Smart Cart - AI-driven shopping cart with upsells
- [ ] Sentinel Gate - Authentication with MFA/RBAC

## Content Widgets (Priority 2)  
- [ ] Doc Prism - Document viewer with semantic highlights
- [ ] Spotlight - Feature highlight/trending content
- [ ] Reviews - Social proof and testimonials
- [ ] Subscribe - Newsletter/email capture
- [ ] Lightwell - Dynamic media gallery

## Data Widgets (Priority 3)
- [ ] Beacon Tiles - KPI dashboard tiles
- [ ] Funnel Flow - Conversion funnel visualization  
- [ ] Talentverse Grid - Agent/developer directory
- [ ] Facet Forge - Faceted search filters
- [ ] ROI Calculator - Enterprise lead generation tool

## Commerce Widgets (Priority 4)
- [ ] Pricing Table - Plan/package comparison
- [ ] Stripe Portal - Hosted billing/payments
- [ ] Comparison Table - Product feature comparison
- [ ] Workflow Runner - Automation execution
- [ ] Prompt Console - Developer LLM testing tool

## Usage Across Sites

### AskRobbie.ai
- Vista Hero, Chat Widget, Specsheet, Pricing Table

### RobbieBlocks.com  
- Vista Hero, Talentverse Grid, Facet Forge, Spotlight

### LeadershipQuotes.com
- Spotlight, Subscribe, Reviews, Doc Prism

### TestPilot.ai
- Vista Hero, Specsheet, ROI Calculator, Reviews

### HeyShopper.com
- Spotlight, Smart Cart, Comparison Table, Pricing Table

## Development Commands

Start continuous build:
```bash
# Cursor will auto-implement widgets based on .cursorrules
echo "start continuous build"
```

Build specific widget:
```bash
echo "build vista-hero"
```

Check status:
```bash
echo "status"
```

## Next Steps

1. Cursor AI will auto-implement widgets in priority order
2. Each widget includes full TypeScript types, tests, and documentation
3. Sites will be assembled automatically as widgets complete
4. Progress tracked in `.cursor/progress.json`

Ready for continuous development!
