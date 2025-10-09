export function generateNeutralReport({ banishment, citizens, votes }) {
  const townPopulation = citizens.length;
  const yesCount = votes.filter((v) => v.vote === "yes").length;
  const noCount = votes.filter((v) => v.vote === "no").length;
  const participation = ((yesCount + noCount) / Math.max(townPopulation, 1)) * 100;
  const yesPct = (yesCount / Math.max(townPopulation, 1)) * 100;

  // Keep it <= 300 words and neutral
  const paragraphs = [];
  paragraphs.push(
    `This is a neutral, factual summary of a 72-hour banishment vote initiated by the mayor for citizen ${banishment.target_citizen_id} in town ${banishment.town_id}. The window began ${banishment.started_at} and ends ${banishment.ends_at}. This document avoids opinions, allegations, or characterizations.`
  );
  paragraphs.push(
    `Reason summary provided at initiation (unverified): ${banishment.reason_summary}. This is presented for transparency and does not constitute endorsement, judgment, or a statement of fact.`
  );
  paragraphs.push(
    `As of this draft, recorded participation is approximately ${participation.toFixed(1)}% of eligible citizens, with current tallies at Yes: ${yesCount}, No: ${noCount}. A banishment passes if Yes votes reach at least 33% of all eligible citizens (current Yes ≈ ${yesPct.toFixed(1)}%).`
  );
  paragraphs.push(
    `Citizens are encouraged to vote either Yes or No without commentary. The aim is broad participation, not persuasion. No person may face more than one banishment vote within six months. Mayors and the President are ineligible targets; only the President may deport outside this process. Any public communication should be reviewed by the mayor to reduce legal risk and avoid defamatory language.`
  );
  paragraphs.push(
    `This draft is nonjudgmental and under 300 words. The mayor may approve or edit this report before distribution. The intent is to provide a factual record of the ongoing vote, key constraints, and current participation, without drawing conclusions or recommending actions.`
  );

  let text = paragraphs.join("\n\n");
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 300) {
    text = words.slice(0, 300).join(" ");
  }
  return text;
}


