// Business Integration System
// Connects Cursor to TestPilot CPG business data

class BusinessIntegration {
  constructor() {
    this.hubspotData = null;
    this.calendarData = null;
    this.dealPipeline = [];
    this.contacts = [];
  }
  
  async loadBusinessContext() {
    console.log('📊 Loading TestPilot CPG business context...');
    
    // Simulate business data loading
    this.dealPipeline = [
      { id: 1, company: 'Simply Good Foods', status: 'Closed', value: 12740, probability: 100 },
      { id: 2, company: 'Quest Nutrition', status: 'Closed', value: 25000, probability: 100 },
      { id: 3, company: 'Cholula', status: 'Closed', value: 15000, probability: 100 },
      { id: 4, company: 'New Prospect', status: 'Qualified', value: 50000, probability: 75 }
    ];
    
    this.contacts = [
      { name: 'Allan Peretz', email: 'allan@testpilotcpg.com', role: 'CEO' },
      { name: 'Kristina', email: 'kristina@testpilotcpg.com', role: 'VA Mentor' }
    ];
    
    console.log('✅ Business context loaded');
    console.log(`💰 Pipeline value: $${this.getTotalPipelineValue()}`);
    console.log(`📞 Contacts: ${this.contacts.length}`);
  }
  
  getTotalPipelineValue() {
    return this.dealPipeline.reduce((total, deal) => total + deal.value, 0);
  }
  
  getActiveDeals() {
    return this.dealPipeline.filter(deal => deal.probability > 0 && deal.status !== 'Closed');
  }
  
  getRevenueContext() {
    const closedDeals = this.dealPipeline.filter(deal => deal.status === 'Closed');
    const totalRevenue = closedDeals.reduce((total, deal) => total + deal.value, 0);
    
    return {
      totalRevenue,
      closedDeals: closedDeals.length,
      activePipeline: this.getTotalPipelineValue(),
      averageDealSize: totalRevenue / closedDeals.length || 0
    };
  }
  
  async getContextualInsights(query) {
    const insights = [];
    
    if (query.toLowerCase().includes('revenue') || query.toLowerCase().includes('money')) {
      const revenue = this.getRevenueContext();
      insights.push(`💰 Revenue: $${revenue.totalRevenue} from ${revenue.closedDeals} deals`);
      insights.push(`📈 Pipeline: $${revenue.activePipeline} in active deals`);
    }
    
    if (query.toLowerCase().includes('deal') || query.toLowerCase().includes('prospect')) {
      const activeDeals = this.getActiveDeals();
      insights.push(`🎯 Active deals: ${activeDeals.length}`);
      activeDeals.forEach(deal => {
        insights.push(`   • ${deal.company}: $${deal.value} (${deal.probability}% probability)`);
      });
    }
    
    return insights;
  }
}

// Export for Cursor integration
if (typeof module !== 'undefined') {
  module.exports = BusinessIntegration;
}
