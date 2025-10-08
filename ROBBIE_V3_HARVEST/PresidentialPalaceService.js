const { Pool } = require('pg');
const { EventEmitter } = require('events');


// Presidential Refuge Service
// Manages the highest level of governance and universe oversight

class PresidentialRefugeService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.presidentialRefugeId = 'presidential_refuge';
  }

  /**
   * Get Presidential Refuge configuration
   */
  getPresidentialRefugeConfig() {
    return {
      id: this.presidentialRefugeId,
      name: 'Presidential Palace',
      description: 'The highest level of governance in the RobbieVerse',
      location: 'Aurora (Virtual)',
      purpose: 'Universe oversight and strategic decision making',
      accessLevel: 'presidential_only',
      features: {
        universeOverview: true,
        townManagement: true,
        strategicPlanning: true,
        resourceAllocation: true,
        constitutionalOversight: true,
        emergencyPowers: true,
        testpilotManagement: true,
        mayoralAppointment: true
      },
      hierarchy: {
        president: {
          role: 'President of RobbieVerse',
          responsibilities: [
            'Universe-wide strategic decisions',
            'Town creation and management',
            'Mayoral appointments and oversight',
            'Constitutional interpretation',
            'Resource allocation across towns',
            'Emergency powers and crisis management',
            'TestPilot company management',
            'Partnership and investment decisions'
          ],
          powers: [
            'Create and dissolve towns',
            'Appoint and remove mayors',
            'Override mayoral decisions',
            'Access all town data and systems',
            'Declare emergencies and activate protocols',
            'Allocate resources and budgets',
            'Interpret and enforce constitution',
            'Make universe-wide policy decisions'
          ]
        },
        mayor: {
          role: 'Mayor of Aurora',
          responsibilities: [
            'Local community management',
            'Coworking space operations',
            'Aurora town governance',
            'Local event coordination',
            'Community engagement',
            'Local resource management',
            'Town-specific policy implementation',
            'Local dispute resolution'
          ],
          powers: [
            'Manage Aurora town operations',
            'Oversee coworking space',
            'Coordinate local events',
            'Manage local resources',
            'Implement town policies',
            'Resolve local disputes',
            'Engage with local community',
            'Report to President on local matters'
          ]
        }
      }
    };
  }

  /**
   * Get universe overview for President
   */
  async getUniverseOverview() {
    const query = `
      SELECT 
        t.id, t.town_name, t.town_type, t.status, t.created_at,
        u.first_name as mayor_first_name, u.last_name as mayor_last_name,
        u.email as mayor_email,
        COUNT(DISTINCT co.user_id) as citizen_count,
        COUNT(DISTINCT cv.id) as open_violations,
        COUNT(DISTINCT CASE WHEN co.next_repledge_date < NOW() THEN co.id END) as overdue_repledges
      FROM app.towns t
      LEFT JOIN app.users u ON t.mayor_id = u.id
      LEFT JOIN app.citizenship_oaths co ON t.id = co.town_id AND co.status = 'active'
      LEFT JOIN app.constitutional_violations cv ON t.id = cv.town_id AND cv.status = 'open'
      WHERE t.status = 'active'
      GROUP BY t.id, t.town_name, t.town_type, t.status, t.created_at, u.first_name, u.last_name, u.email
      ORDER BY t.town_type, t.town_name
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get strategic metrics for President
   */
  async getStrategicMetrics() {
    const query = `
      SELECT 
        'total_towns' as metric,
        COUNT(*) as value
      FROM app.towns 
      WHERE status = 'active'
      
      UNION ALL
      
      SELECT 
        'total_citizens' as metric,
        COUNT(DISTINCT user_id) as value
      FROM app.citizenship_oaths 
      WHERE status = 'active'
      
      UNION ALL
      
      SELECT 
        'active_mayors' as metric,
        COUNT(DISTINCT mayor_id) as value
      FROM app.towns 
      WHERE status = 'active' AND mayor_id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'open_violations' as metric,
        COUNT(*) as value
      FROM app.constitutional_violations 
      WHERE status = 'open'
      
      UNION ALL
      
      SELECT 
        'overdue_repledges' as metric,
        COUNT(*) as value
      FROM app.citizenship_oaths 
      WHERE status = 'active' AND next_repledge_date < NOW()
      
      UNION ALL
      
      SELECT 
        'revenue_generated' as metric,
        COALESCE(SUM(value), 0) as value
      FROM app.deals 
      WHERE status = 'closed_won' AND created_at >= NOW() - INTERVAL '30 days'
    `;

    const result = await this.pool.query(query);
    return result.rows.reduce((acc, row) => {
      acc[row.metric] = row.value;
      return acc;
    }, {});
  }

  /**
   * Get TestPilot company status
   */
  async getTestPilotStatus() {
    const query = `
      SELECT 
        t.*, u.first_name as mayor_first_name, u.last_name as mayor_last_name,
        COUNT(DISTINCT co.user_id) as employee_count,
        COUNT(DISTINCT d.id) as active_deals,
        COALESCE(SUM(d.value), 0) as pipeline_value
      FROM app.towns t
      LEFT JOIN app.users u ON t.mayor_id = u.id
      LEFT JOIN app.citizenship_oaths co ON t.id = co.town_id AND co.status = 'active'
      LEFT JOIN app.deals d ON t.id = d.town_id AND d.status = 'active'
      WHERE t.town_name = 'TestPilot' AND t.town_type = 'company'
      GROUP BY t.id, t.town_name, t.town_type, t.status, t.created_at, u.first_name, u.last_name
    `;

    const result = await this.pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Get Aurora town status (Mayor Patrick Pittman's domain)
   */
  async getAuroraStatus() {
    const query = `
      SELECT 
        t.*, u.first_name as mayor_first_name, u.last_name as mayor_last_name,
        u.email as mayor_email, u.linkedin_url as mayor_linkedin,
        COUNT(DISTINCT co.user_id) as citizen_count,
        COUNT(DISTINCT CASE WHEN co.oath_type = 'initial' THEN co.id END) as new_citizens_this_year,
        COUNT(DISTINCT cv.id) as open_violations,
        COUNT(DISTINCT CASE WHEN co.next_repledge_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN co.id END) as upcoming_repledges
      FROM app.towns t
      LEFT JOIN app.users u ON t.mayor_id = u.id
      LEFT JOIN app.citizenship_oaths co ON t.id = co.town_id AND co.status = 'active'
      LEFT JOIN app.constitutional_violations cv ON t.id = cv.town_id AND cv.status = 'open'
      WHERE t.town_name = 'Aurora' AND t.town_type = 'robbieverse'
      GROUP BY t.id, t.town_name, t.town_type, t.status, t.created_at, u.first_name, u.last_name, u.email, u.linkedin_url
    `;

    const result = await this.pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Appoint mayor to a town
   */
  async appointMayor(townId, userId, appointedBy) {
    const query = `
      UPDATE app.towns 
      SET mayor_id = $1, mayor_appointed_at = NOW(), mayor_appointed_by = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, appointedBy, townId]);
    
    // Grant mayoral privileges
    await this.grantMayoralPrivileges(userId, townId);
    
    // Log appointment
    await this.logPresidentialAction(appointedBy, 'mayor_appointed', {
      townId,
      newMayorId: userId,
      previousMayorId: result.rows[0].mayor_id
    });

    this.emit('mayorAppointed', { townId, userId, appointedBy });
    return result.rows[0];
  }

  /**
   * Remove mayor from a town
   */
  async removeMayor(townId, removedBy, reason) {
    const query = `
      SELECT mayor_id FROM app.towns WHERE id = $1
    `;
    const townResult = await this.pool.query(query, [townId]);
    
    if (townResult.rows.length === 0) {
      throw new Error('Town not found');
    }

    const mayorId = townResult.rows[0].mayor_id;
    
    // Remove mayoral privileges
    await this.revokeMayoralPrivileges(mayorId, townId);
    
    // Update town
    const updateQuery = `
      UPDATE app.towns 
      SET mayor_id = NULL, mayor_removed_at = NOW(), mayor_removed_by = $1, mayor_removal_reason = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await this.pool.query(updateQuery, [removedBy, reason, townId]);
    
    // Log removal
    await this.logPresidentialAction(removedBy, 'mayor_removed', {
      townId,
      removedMayorId: mayorId,
      reason
    });

    this.emit('mayorRemoved', { townId, mayorId, removedBy, reason });
    return result.rows[0];
  }

  /**
   * Create new town
   */
  async createTown(townData, createdBy) {
    const {
      townName,
      townType,
      description,
      mayorId,
      parentTownId = null
    } = townData;

    const query = `
      INSERT INTO app.towns (
        town_name, town_type, description, mayor_id, parent_town_id,
        status, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, 'active', $6, NOW()
      ) RETURNING *
    `;

    const result = await this.pool.query(query, [
      townName, townType, description, mayorId, parentTownId, createdBy
    ]);

    // Grant mayoral privileges if mayor specified
    if (mayorId) {
      await this.grantMayoralPrivileges(mayorId, result.rows[0].id);
    }

    // Log creation
    await this.logPresidentialAction(createdBy, 'town_created', {
      townId: result.rows[0].id,
      townName,
      townType,
      mayorId
    });

    this.emit('townCreated', { townId: result.rows[0].id, townData, createdBy });
    return result.rows[0];
  }

  /**
   * Grant mayoral privileges
   */
  async grantMayoralPrivileges(userId, townId) {
    // Update user role to mayor
    await this.pool.query(
      'UPDATE app.users SET role = $1 WHERE id = $2',
      ['mayor', userId]
    );

    // Grant town access
    await this.pool.query(
      'INSERT INTO app.town_access (user_id, town_id, access_level, granted_at) VALUES ($1, $2, $3, NOW())',
      [userId, townId, 'mayoral']
    );

  }

  /**
   * Revoke mayoral privileges
   */
  async revokeMayoralPrivileges(userId, townId) {
    // Update town access
    await this.pool.query(
      'UPDATE app.town_access SET access_level = $1, revoked_at = NOW() WHERE user_id = $2 AND town_id = $3',
      ['revoked', userId, townId]
    );

    // Check if user is mayor of other towns
    const otherTownsQuery = `
      SELECT COUNT(*) as count FROM app.towns WHERE mayor_id = $1 AND id != $2
    `;
    const otherTownsResult = await this.pool.query(otherTownsQuery, [userId, townId]);
    
    // If not mayor of other towns, change role back to citizen
    if (otherTownsResult.rows[0].count === '0') {
      await this.pool.query(
        'UPDATE app.users SET role = $1 WHERE id = $2',
        ['citizen', userId]
      );
    }

  }

  /**
   * Get presidential action log
   */
  async getPresidentialActionLog(limit = 50, offset = 0) {
    const query = `
      SELECT 
        pal.*, u.first_name, u.last_name, t.town_name
      FROM app.presidential_actions pal
      LEFT JOIN app.users u ON pal.user_id = u.id
      LEFT JOIN app.towns t ON pal.town_id = t.id
      ORDER BY pal.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Log presidential action
   */
  async logPresidentialAction(userId, actionType, details) {
    const query = `
      INSERT INTO app.presidential_actions (
        user_id, action_type, details, created_at
      ) VALUES ($1, $2, $3, NOW())
    `;
    
    await this.pool.query(query, [userId, actionType, JSON.stringify(details)]);
  }

  /**
   * Get emergency powers status
   */
  async getEmergencyPowersStatus() {
    const query = `
      SELECT 
        ep.*, u.first_name, u.last_name
      FROM app.emergency_powers ep
      LEFT JOIN app.users u ON ep.activated_by = u.id
      WHERE ep.status = 'active'
      ORDER BY ep.activated_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Activate emergency powers
   */
  async activateEmergencyPowers(userId, reason, scope = 'universe') {
    const query = `
      INSERT INTO app.emergency_powers (
        activated_by, reason, scope, status, activated_at
      ) VALUES ($1, $2, $3, 'active', NOW())
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, reason, scope]);
    
    // Log activation
    await this.logPresidentialAction(userId, 'emergency_powers_activated', {
      reason,
      scope,
      emergencyPowersId: result.rows[0].id
    });

    this.emit('emergencyPowersActivated', { userId, reason, scope });
    return result.rows[0];
  }

  /**
   * Deactivate emergency powers
   */
  async deactivateEmergencyPowers(userId, reason) {
    const query = `
      UPDATE app.emergency_powers 
      SET status = 'deactivated', deactivated_at = NOW(), deactivated_by = $1, deactivation_reason = $2
      WHERE status = 'active'
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, reason]);
    
    // Log deactivation
    await this.logPresidentialAction(userId, 'emergency_powers_deactivated', {
      reason,
      emergencyPowersId: result.rows[0].id
    });

    this.emit('emergencyPowersDeactivated', { userId, reason });
    return result.rows[0];
  }
}

module.exports = PresidentialRefugeService;
