import { randomUUID } from "crypto";
import { db, initializeSchema, withinLastMonths } from "./db.js";
import { generateNeutralReport } from "./report.js";

function getCitizenById(citizenId) {
  return db.prepare("SELECT * FROM citizens WHERE id = ?").get(citizenId);
}

function getTownCitizens(townId) {
  return db.prepare("SELECT * FROM citizens WHERE town_id = ?").all(townId);
}

function getActiveBanishmentForTarget(targetId) {
  return db
    .prepare(
      "SELECT * FROM banishments WHERE target_citizen_id = ? AND status = 'active'"
    )
    .get(targetId);
}

function getRecentBanishmentsForTarget(targetId) {
  return db
    .prepare(
      "SELECT * FROM banishments WHERE target_citizen_id = ? ORDER BY started_at DESC LIMIT 5"
    )
    .all(targetId);
}

function computeTally(banishmentId) {
  const rows = db
    .prepare(
      "SELECT vote, COUNT(*) as c FROM banishment_votes WHERE banishment_id = ? GROUP BY vote"
    )
    .all(banishmentId);
  let yes = 0;
  let no = 0;
  for (const r of rows) {
    if (r.vote === "yes") yes = r.c;
    if (r.vote === "no") no = r.c;
  }
  return { yes, no };
}

export async function registerBanishmentRoutes(app) {
  initializeSchema();

  // Create banishment vote (mayor initiates)
  app.post("/banishments", async (request, reply) => {
    const { target_citizen_id, mayor_id, town_id, reason_summary, started_at } =
      request.body || {};
    if (!target_citizen_id || !mayor_id || !town_id || !reason_summary) {
      return reply.code(400).send({ error: "missing_fields" });
    }
    const mayor = getCitizenById(mayor_id);
    if (!mayor || mayor.role !== "mayor" || mayor.town_id !== town_id) {
      return reply.code(403).send({ error: "only_mayor_of_town_can_initiate" });
    }
    const target = getCitizenById(target_citizen_id);
    if (!target || target.town_id !== town_id) {
      return reply.code(404).send({ error: "target_not_found_in_town" });
    }
    // Cannot target mayors or president
    if (target.role === "mayor" || target.role === "president") {
      return reply.code(403).send({ error: "cannot_target_mayor_or_president" });
    }

    // Rule: No more than 1 banishment vote per person in 6 months
    const recent = getRecentBanishmentsForTarget(target_citizen_id).filter((b) =>
      withinLastMonths(b.started_at, 6)
    );
    if (recent.length > 0) {
      return reply.code(409).send({ error: "recent_banishment_exists" });
    }

    // Only one active per target
    const active = getActiveBanishmentForTarget(target_citizen_id);
    if (active) {
      return reply.code(409).send({ error: "banishment_already_active" });
    }

    const id = randomUUID();
    const startedAt = started_at || new Date().toISOString();
    const endsAt = new Date(Date.parse(startedAt) + 72 * 60 * 60 * 1000)
      .toISOString();

    db.prepare(
      `INSERT INTO banishments (
        id, target_citizen_id, mayor_id, town_id, reason_summary, status, started_at, ends_at
      ) VALUES (?,?,?,?,?,'active',?,?)`
    ).run(id, target_citizen_id, mayor_id, town_id, reason_summary, startedAt, endsAt);

    // schedule default reminders (24h, 6h, 1h before end)
    const reminders = [24, 6, 1].map((h) => {
      const when = new Date(Date.parse(endsAt) - h * 60 * 60 * 1000).toISOString();
      return { id: randomUUID(), when };
    });
    const stmt = db.prepare("INSERT INTO banishment_reminders (id, banishment_id, when_at, channel, note) VALUES (?,?,?,?,?)");
    for (const r of reminders) {
      stmt.run(r.id, id, r.when, 'system', `${hLabel(r.when)} until vote closes`);
    }

    return { id, status: "active", started_at: startedAt, ends_at: endsAt };
  });

  function hLabel(whenIso) {
    const deltaMs = Date.parse(whenIso) - Date.now();
    const hours = Math.round(Math.abs(deltaMs) / (60 * 60 * 1000));
    return `${hours}h`;
  }

  // Cast vote
  app.post("/banishments/:id/votes", async (request, reply) => {
    const { id } = request.params;
    const { voter_citizen_id, vote } = request.body || {};
    if (!voter_citizen_id || !["yes", "no"].includes(vote)) {
      return reply.code(400).send({ error: "invalid_vote" });
    }
    const ban = db.prepare("SELECT * FROM banishments WHERE id = ?").get(id);
    if (!ban) return reply.code(404).send({ error: "not_found" });
    if (!["active", "awaiting_tiebreak"].includes(ban.status)) {
      return reply.code(409).send({ error: "banishment_not_votable" });
    }
    const voter = getCitizenById(voter_citizen_id);
    if (!voter || voter.town_id !== ban.town_id) {
      return reply.code(403).send({ error: "voter_not_in_town" });
    }
    try {
      db.prepare(
        "INSERT INTO banishment_votes (id, banishment_id, voter_citizen_id, vote) VALUES (?,?,?,?)"
      ).run(randomUUID(), id, voter_citizen_id, vote);
    } catch (e) {
      return reply.code(409).send({ error: "already_voted" });
    }
    const { yes, no } = computeTally(id);
    db.prepare(
      "UPDATE banishments SET result_yes = ?, result_no = ? WHERE id = ?"
    ).run(yes, no, id);
    return { ok: true, tally: { yes, no } };
  });

  // Removed tie-break mechanics per new rule (exactly 33% threshold decides)

  // President deport endpoint
  app.post("/banishments/deport", async (request, reply) => {
    const { president_id, target_citizen_id, town_id, reason_summary } = request.body || {};
    if (!president_id || !target_citizen_id || !town_id) {
      return reply.code(400).send({ error: "missing_fields" });
    }
    const president = getCitizenById(president_id);
    if (!president || president.role !== "president") {
      return reply.code(403).send({ error: "not_president" });
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO banishments (id, target_citizen_id, mayor_id, town_id, reason_summary, status, started_at, ends_at, final_decision, closed_at)
       VALUES (?,?,?,?,?,'passed',?,?, 'deported', ?)`
    ).run(id, target_citizen_id, president_id, town_id, reason_summary || "Presidential deportation", now, now, now);
    return { id, status: "passed", final_decision: "deported" };
  });

  // Get banishment
  app.get("/banishments/:id", async (request) => {
    const { id } = request.params;
    const ban = db.prepare("SELECT * FROM banishments WHERE id = ?").get(id);
    if (!ban) return { error: "not_found" };
    const votes = db
      .prepare("SELECT voter_citizen_id, vote, created_at FROM banishment_votes WHERE banishment_id = ?")
      .all(id);
    return { ...ban, votes };
  });

  // List active by town
  app.get("/banishments", async (request) => {
    const { town_id, status } = request.query || {};
    const st = status || "active";
    let rows = db
      .prepare("SELECT * FROM banishments WHERE town_id = ? AND status = ? ORDER BY started_at DESC")
      .all(town_id, st);
    rows = rows.map((b) => withStatusMetrics(b));
    return { rows };
  });

  // Status with countdown and percentages (for UI)
  app.get("/banishments/:id/status", async (request, reply) => {
    const { id } = request.params;
    const ban = db.prepare("SELECT * FROM banishments WHERE id = ?").get(id);
    if (!ban) return reply.code(404).send({ error: "not_found" });
    return withStatusMetrics(ban);
  });

  function withStatusMetrics(ban) {
    const now = Date.now();
    const ends = Date.parse(ban.ends_at);
    const msRemaining = Math.max(0, ends - now);
    const seconds = Math.floor(msRemaining / 1000) % 60;
    const minutes = Math.floor(msRemaining / (1000 * 60)) % 60;
    const hours = Math.floor(msRemaining / (1000 * 60 * 60)) % 24;
    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const { yes, no } = computeTally(ban.id);
    const voters = db.prepare("SELECT COUNT(*) c FROM citizens WHERE town_id = ?").get(ban.town_id).c;
    const participation = ((yes + no) / Math.max(voters, 1)) * 100;
    const yesPct = (yes / Math.max(voters, 1)) * 100;
    return {
      ...ban,
      countdown: { days, hours, minutes, seconds },
      tally: { yes, no },
      voters,
      participation_pct: participation,
      yes_pct: yesPct,
      threshold_yes_pct: 33
    };
  }

  // Close (primarily for scheduler/manual ops) — 33% yes threshold
  app.post("/banishments/:id/close", async (request, reply) => {
    const { id } = request.params;
    const ban = db.prepare("SELECT * FROM banishments WHERE id = ?").get(id);
    if (!ban) return reply.code(404).send({ error: "not_found" });
    if (ban.status !== "active") {
      return reply.code(409).send({ error: "not_open" });
    }
    const { yes, no } = computeTally(id);
    const voters = db.prepare("SELECT COUNT(*) c FROM citizens WHERE town_id = ?").get(ban.town_id).c;
    const yesPct = voters > 0 ? (yes / voters) * 100 : 0;
    const passed = yesPct >= 33;
    const status = passed ? "passed" : "failed";
    const finalDecision = passed ? "banish" : "retain";
    db.prepare(
      "UPDATE banishments SET status = ?, final_decision = ?, closed_at = ?, result_yes = ?, result_no = ? WHERE id = ?"
    ).run(status, finalDecision, new Date().toISOString(), yes, no, id);
    return { status, final_decision: finalDecision, tally: { yes, no }, threshold_yes_pct: 33, actual_yes_pct: yesPct };
  });

  // Generate neutral report draft
  app.post("/banishments/:id/report", async (request, reply) => {
    const { id } = request.params;
    const ban = db.prepare("SELECT * FROM banishments WHERE id = ?").get(id);
    if (!ban) return reply.code(404).send({ error: "not_found" });
    const citizens = getTownCitizens(ban.town_id);
    const votes = db
      .prepare("SELECT voter_citizen_id, vote FROM banishment_votes WHERE banishment_id = ?")
      .all(id);
    const content = generateNeutralReport({ banishment: ban, citizens, votes });
    const reportId = randomUUID();
    db.prepare(
      "INSERT INTO banishment_reports (id, banishment_id, content) VALUES (?,?,?)"
    ).run(reportId, id, content);
    db.prepare("UPDATE banishments SET report_draft = ? WHERE id = ?").run(content, id);
    return { id: reportId, content };
  });

  // Approve report by mayor
  app.post("/banishments/:id/report/approve", async (request, reply) => {
    const { id } = request.params;
    const { mayor_id } = request.body || {};
    const ban = db.prepare("SELECT * FROM banishments WHERE id = ?").get(id);
    if (!ban) return reply.code(404).send({ error: "not_found" });
    if (ban.mayor_id !== mayor_id) return reply.code(403).send({ error: "not_mayor" });
    db.prepare(
      "UPDATE banishment_reports SET approved_by_mayor = 1, approved_at = ? WHERE banishment_id = ?"
    ).run(new Date().toISOString(), id);
    return { ok: true };
  });
}


