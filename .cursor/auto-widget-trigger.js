// Auto Widget Development Trigger
// Activates when user mentions widget names

const widgetNames = [
  'Vista Hero', 'Chat Widget', 'Specsheet', 'Smart Cart', 'Doc Prism',
  'Spotlight', 'Talentverse Grid', 'Facet Forge', 'Funnel Flow', 'Beacon Tiles',
  'Pricing Table', 'Stripe Portal', 'Reviews', 'ROI Calculator', 'Comparison Table',
  'Lightwell', 'Subscribe', 'Sentinel Gate', 'Workflow Runner', 'Prompt Console'
];

function detectWidgetRequest(message) {
  const mentionedWidgets = widgetNames.filter(widget => 
    message.toLowerCase().includes(widget.toLowerCase())
  );
  
  if (mentionedWidgets.length > 0) {
    console.log(`🎯 Widget request detected: ${mentionedWidgets.join(', ')}`);
    return {
      action: 'generate_widget',
      widgets: mentionedWidgets,
      timestamp: new Date().toISOString()
    };
  }
  
  return null;
}

// Export for Cursor integration
if (typeof module !== 'undefined') {
  module.exports = { detectWidgetRequest, widgetNames };
}
