export const LAUNCH_DATE = '2026-11-19T00:00:00-05:00';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function opportunityScore(opportunity) {
  const revenue = clamp(opportunity.estRevenue, 0, 25000) / 25000;
  const confidence = clamp(opportunity.confidence, 1, 5) / 5;
  const urgency = clamp(opportunity.urgency, 1, 5) / 5;
  const effort = 1 - ((clamp(opportunity.effort, 1, 5) - 1) / 4);
  return Math.round((revenue * 38 + confidence * 28 + urgency * 22 + effort * 12));
}

export function weightedPipelineValue(opportunities) {
  return opportunities.reduce((sum, opportunity) => {
    const confidence = clamp(opportunity.confidence, 1, 5) / 5;
    return sum + (Number(opportunity.estRevenue) || 0) * confidence;
  }, 0);
}

export function daysUntilLaunch(now = new Date(), launch = new Date(LAUNCH_DATE)) {
  return Math.max(0, Math.ceil((launch.getTime() - now.getTime()) / 86400000));
}

export function nextTasksFor(opportunity) {
  const lane = opportunity.lane || 'Auxiliary';
  const title = opportunity.title || 'New play';
  if (lane === 'Creator Ops') {
    return [
      `Find 20 small streamers already posting GTA VI prep content for ${title}`,
      `Draft a $299/mo clipper offer for ${title}`,
      `Cut one sample short from owned or licensed footage`,
    ];
  }
  if (lane === 'Affiliate') {
    return [
      `List the 12 buyer questions a non-gamer asks before GTA VI launch`,
      `Build a simple gear shortlist with affiliate links`,
      `Publish one spoiler-free buyer page for ${title}`,
    ];
  }
  if (lane === 'Local Business') {
    return [
      `Make 10 Florida/Miami-adjacent post concepts without Rockstar assets`,
      `Find 30 local businesses that can ride the attention wave`,
      `Send a 5-post starter package pitch for ${title}`,
    ];
  }
  if (lane === 'In-Game Intel') {
    return [
      `Recruit 3 players to report legal payout data after launch`,
      `Create the payout/time/failure-rate tracking sheet`,
      `Publish the first no-exploit money-route brief for ${title}`,
    ];
  }
  return [
    `Define the buyer, price, and 48-hour offer for ${title}`,
    `Create one proof asset people can react to`,
    `DM 25 likely buyers with a plain paid pilot offer`,
  ];
}
