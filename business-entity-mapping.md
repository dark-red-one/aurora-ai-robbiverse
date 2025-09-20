# Business Entity Data Segregation Strategy

## Current External Data Analysis

### Owner ID Distribution:
- **79763634**: 66 deals, 6,810 companies, 1,851 contacts (Main business)
- **159111287**: 1 deal (Secondary entity)
- **159097666**: 11 companies, 10 contacts (Another entity)
- **Empty/undefined**: 1 deal, 1,088 companies, 3,796 contacts (Unassigned data)

## Business Entity Mapping Strategy

### 1. TestPilot (Primary Business)
- **Town**: Aurora (Capital)
- **Owner ID**: `testpilot` or `aurora`
- **Data**: Main business deals, companies, contacts
- **Mapping**: Assign owner_id `79763634` data to `testpilot`

### 2. Fluenti (US Operations)
- **Town**: Fluenti
- **Owner ID**: `fluenti`
- **Data**: US-focused operations
- **Mapping**: Assign owner_id `159097666` data to `fluenti`

### 3. Collaboration (Development)
- **Town**: Collaboration
- **Owner ID**: `collaboration`
- **Data**: Test data, development contacts
- **Mapping**: Assign empty/undefined data to `collaboration`

## Data Import Strategy

### Phase 1: Business Entity Classification
```sql
-- Map existing owner_ids to our town system
UPDATE companies SET owner_id = 'testpilot' WHERE owner_id = '79763634';
UPDATE companies SET owner_id = 'fluenti' WHERE owner_id = '159097666';
UPDATE companies SET owner_id = 'collaboration' WHERE owner_id IS NULL OR owner_id = '';

-- Same for contacts and deals
UPDATE contacts SET owner_id = 'testpilot' WHERE owner_id = '79763634';
UPDATE contacts SET owner_id = 'fluenti' WHERE owner_id = '159097666';
UPDATE contacts SET owner_id = 'collaboration' WHERE owner_id IS NULL OR owner_id = '';

UPDATE deals SET owner_id = 'testpilot' WHERE owner_id = '79763634';
UPDATE deals SET owner_id = 'fluenti' WHERE owner_id = '159097666';
UPDATE deals SET owner_id = 'collaboration' WHERE owner_id IS NULL OR owner_id = '';
```

### Phase 2: Town-Specific Views
Each town will only see their own data through the views we created:
- `aurora_companies` - Shows only testpilot data
- `fluenti_companies` - Shows only fluenti data  
- `collaboration_companies` - Shows only collaboration data

### Phase 3: Cross-Town Analytics (Aurora Only)
Aurora (as capital) can see all data through `cross_town_analytics` view for oversight.

## Benefits

### 1. Data Isolation
- Each town only sees their own business data
- No accidental cross-contamination
- Clean separation of concerns

### 2. Business Logic
- TestPilot sees their main business (6,810 companies, 66 deals)
- Fluenti sees their US operations (11 companies, 1 deal)
- Collaboration sees development data (1,088 companies, 3,796 contacts)

### 3. Scalability
- Easy to add new business entities
- Clear ownership model
- Audit trail for data changes

## Implementation

The data import script will automatically map the existing owner_ids to our town system, ensuring each business entity only sees their relevant data while maintaining the relationships and business logic.
