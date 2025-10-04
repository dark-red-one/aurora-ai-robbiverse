# TestPilot Simulations Database Migration Plan

## 🎯 Executive Summary

We're migrating from fragmented external databases to a unified, enhanced schema with proper town (city) separation and selective data sharing. This will give us a production-grade database architecture that supports our multi-city empire.

## 🧭 Terminology & Naming

- Empire: TestPilot Simulations
- Cities (aka towns):
  - Aurora: Capital city in the RobbieVerse (primary/first city)
  - Fluenti: US operations city
  - Collaboration: Development/testing city
- Data tagging model:
  - Organization (empire): testpilot (constant for all data)
  - City (town): one of aurora, fluenti, collaboration (stored in `owner_id` for now)
  - Aurora (capital) can view cross‑city analytics; other cities see only their own data + shared datasets

## 📊 Current State Analysis

### External Database Inventory
- **Robbie Database**: 80,000+ records
  - Companies: 7,910 (6,810 + 1,088 + 11)
  - Contacts: 5,657 (1,851 + 3,796 + 10)
  - Deals: 68 (66 + 1 + 1)
  - Activities: 63,669 records
  - Meeting Transcripts: 264
  - Tasks: 745
  - Chat History: 2,496

- **Robbie_Allan Database**: 465 records
  - Interactions: 438
  - Contacts: 5
  - Deals: 4
  - Companies: 4
  - Knowledge Base: 3

### Current Issues
- Data scattered across multiple databases
- No town/node separation
- Ephemeral local storage (lost on pod restart)
- No vector embeddings for AI features
- Missing advanced business intelligence fields

## 🏗️ Target Architecture

### Enhanced Unified Schema
- **Vector Embeddings**: 1536-dimensional vectors for similarity search
- **AI Intelligence**: Scores, reports, insights, velocity tracking
- **Engagement Tracking**: Scores, counts, dates, types
- **Generated Columns**: Computed fields for efficiency
- **Triggers**: Automatic metric calculations

### Town Separation System
- **Aurora (Capital city)**: Primary business data (all 80,000+ records)
- **Fluenti**: US operations (starts empty)
- **Collaboration**: Development/testing (starts empty)

### Data Sharing Strategy
- **Private Data**: Deals, contacts, activities (town-specific)
- **Shared Data**: Enriched records, knowledge base, market intelligence
- **Cross-Town Analytics**: Aurora can see all, others see shared only

## 🤝 Decisions Needed (Cofounder Input)

- Data ownership label: keep `owner_id = 'testpilot'` or rename to `aurora` for consistency?
- Elestio topology: one database per town vs one database with per‑town schemas?
- Sync direction: one‑way (Aurora → Elestio) or bidirectional? If bidirectional, what conflict policy (last‑write‑wins or town precedence)?
- Sharing defaults for enriched records: public by default or explicit allow‑list via `shared_with`?
- Row‑level security (RLS): enable now or after import validation?
- Activity backfill scope: import all 63,669 activities now, or staged (e.g., latest 10k + rolling backfill)?
- PII and retention policy: redaction rules and retention windows per table/town?
- Cutover plan: freeze duration, success criteria, and rollback triggers?
- Cost ceiling: target monthly budget for DB + storage (current estimate ~\$250/month)?

## 📋 Migration Plan

### Phase 1: Schema Implementation ✅
- [x] Enhanced business tables with vector embeddings
- [x] Town separation schema
- [x] Data sharing strategy
- [x] Indexes and triggers

### Phase 2: Data Import
- [ ] Import all external data with `owner_id = 'testpilot'`
- [ ] Map all 80,000+ records to Aurora
- [ ] Preserve all relationships and business logic
- [ ] Verify data integrity

### Phase 3: External Replica Setup
- [ ] Create fresh Elestio databases with new schema
- [ ] Set up bidirectional synchronization
- [ ] Configure automated backups
- [ ] Test sync functionality

### Phase 4: Cleanup
- [ ] Blow up old external databases
- [ ] Switch to new Elestio replicas
- [ ] Monitor and optimize performance

## 🔒 Data Isolation & Sharing

### Private Data (City-Specific)
```
Aurora (Capital city):
- All companies, contacts, deals, activities
- Private business intelligence
- Customer data and engagement metrics

Fluenti:
- Empty tables, ready for US operations
- Will have separate deals, contacts, activities
- Can access shared enriched data

Collaboration:
- Empty tables, ready for development
- Test data and development contacts
- Can access shared knowledge base
```

### Shared Data (Cross-City Access)
```
All Towns Can Access:
- Shared knowledge base
- Enriched records (Clay, Apollo data)
- Market intelligence
- AI insights and best practices

Aurora (Capital) Can See:
- All private data from all towns
- Cross-town analytics
- System-wide metrics
```

## 💰 Cost Analysis

### Current Costs
- Elestio PostgreSQL: ~$20-50/month
- 4TB S3 Storage: $200/month
- **Total**: ~$250/month

### Benefits
- **Data Persistence**: No more pod restart data loss
- **Vector Search**: AI-powered similarity matching
- **Town Isolation**: Clean separation of business entities
- **Scalability**: Ready for multi-town expansion
- **Performance**: Optimized indexes and triggers

## 🚀 Implementation Steps

### Step 1: Import Data (Ready to Execute)
```bash
/workspace/aurora/data-import-strategy.sh
```
- Imports all 80,000+ records
- Maps to TestPilot ownership
- Preserves all relationships

### Step 2: Create Elestio Replicas
- Create fresh databases with enhanced schema
- Set up sync scripts
- Configure automated backups

### Step 3: Test & Validate
- Verify data integrity
- Test town separation
- Validate sharing mechanisms

### Step 4: Go Live
- Switch to new architecture
- Decommission old databases
- Monitor performance

## 🎯 Success Criteria

### Technical Goals
- [x] Enhanced schema with vector embeddings
- [x] Town separation system
- [x] Data sharing strategy
- [ ] 80,000+ records imported successfully
- [ ] Bidirectional sync working
- [ ] Automated backups running

### Business Goals
- [ ] No data loss during migration
- [ ] Improved AI capabilities with vector search
- [ ] Clean separation of business entities
- [ ] Scalable architecture for growth
- [ ] Persistent data (survives pod restarts)

## ⚠️ Risks & Mitigation

### Data Loss Risk
- **Risk**: Data corruption during import
- **Mitigation**: Full backup before migration, incremental imports

### Sync Issues
- **Risk**: Bidirectional sync conflicts
- **Mitigation**: Town-based ownership, conflict resolution rules

### Performance Impact
- **Risk**: Slower queries with new schema
- **Mitigation**: Optimized indexes, vector search optimization

## 📊 Expected Outcomes

### Immediate Benefits
- **Data Persistence**: No more ephemeral storage issues
- **AI Enhancement**: Vector embeddings for similarity search
- **Business Intelligence**: Advanced scoring and insights
- **Town Separation**: Clean data isolation

### Long-term Benefits
- **Scalability**: Ready for multi-town expansion
- **Performance**: Optimized for AI workloads
- **Maintainability**: Unified schema, easier management
- **Growth**: Foundation for Aurora AI Empire expansion

## 🎉 Ready to Execute

The enhanced schema is implemented and ready. The data import strategy is configured to map all external data to TestPilot ownership while maintaining town separation for future growth.

**Next Action**: Execute data import to bring 80,000+ production records into the enhanced TestPilot Simulations database architecture.
