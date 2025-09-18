import { db } from "./db.js";

function nowIso() {
  return new Date().toISOString();
}

export function startScheduler(logger = console) {
  // Reminder tick: every 10 minutes
  const reminderIntervalMs = 10 * 60 * 1000;
  const closeCheckMs = 60 * 1000;
  const warmIntervalMs = 5 * 60 * 1000; // 5 minutes

  setInterval(() => {
    try {
      const due = db
        .prepare(
          "SELECT * FROM banishment_reminders WHERE sent = 0 AND when_at <= datetime('now')"
        )
        .all();
      for (const r of due) {
        // In a real system, send to preferred channels (chat/email). Here we log.
        logger.info?.({ reminder: r }, "banishment reminder due");
        db.prepare("UPDATE banishment_reminders SET sent = 1 WHERE id = ?").run(r.id);
      }
    } catch (e) {
      logger.error?.(e, "reminder tick failed");
    }
  }, reminderIntervalMs);

  // Closing tick: check for expired banishments (33% yes threshold)
  setInterval(() => {
    try {
      const active = db
        .prepare(
          "SELECT * FROM banishments WHERE status = 'active' AND ends_at <= datetime('now')"
        )
        .all();
      for (const b of active) {
        const tally = db
          .prepare(
            "SELECT vote, COUNT(*) c FROM banishment_votes WHERE banishment_id = ? GROUP BY vote"
          )
          .all(b.id);
        let yes = 0;
        let no = 0;
        for (const t of tally) {
          if (t.vote === "yes") yes = t.c;
          if (t.vote === "no") no = t.c;
        }
        const voters = db.prepare("SELECT COUNT(*) c FROM citizens WHERE town_id = ?").get(b.town_id).c;
        const yesPct = voters > 0 ? (yes / voters) * 100 : 0;
        const passed = yesPct >= 33;
        const status = passed ? "passed" : "failed";
        const decision = passed ? "banish" : "retain";
        db.prepare(
          "UPDATE banishments SET status = ?, final_decision = ?, closed_at = ?, result_yes = ?, result_no = ? WHERE id = ?"
        ).run(status, decision, nowIso(), yes, no, b.id);
        logger.info?.({ id: b.id, status, decision }, "banishment auto-closed");
      }
    } catch (e) {
      logger.error?.(e, "close tick failed");
    }
  }, closeCheckMs);

  // Warm-up tick: keep default model resident to reduce first-token latency
  setInterval(async () => {
    try {
      const res = await fetch("http://localhost:5055/llm/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: process.env.DEFAULT_MODEL || "qwen-local",
          messages: [{ role: "user", content: "." }],
          max_tokens: 1,
          temperature: 0,
          keep_alive: "30m"
        })
      });
      if (!res.ok) {
        logger.warn?.({ status: res.status }, "warm-up ping failed");
      }
    } catch (e) {
      logger.warn?.(e, "warm-up tick error");
    }
  }, warmIntervalMs);
}


