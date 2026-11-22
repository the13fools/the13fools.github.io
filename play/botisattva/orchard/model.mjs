export const AGENT_COUNT = 12;
export const DAYS = 30;
export const CAPACITY = 120;
export const DRY_SPELL = { firstDay: 10, lastDay: 19 };

const STARTING_STOCK = 84;
const STARTING_RESERVES = [5, 4, 0, 3, 6, 4, 5, 1, 7, 4, 5, 3];
const BOTISATTVA_ORDER = [4, 8, 1, 10, 6, 0, 11, 3, 9, 5, 2, 7];

export function newOrchard(botisattvas) {
  const helpers = new Set(BOTISATTVA_ORDER.slice(0, botisattvas));
  return {
    day: 0,
    stock: STARTING_STOCK,
    agents: STARTING_RESERVES.map((reserve, index) => ({
      reserve,
      botisattva: helpers.has(index),
      hungryDays: 0,
      present: true,
      action: "",
    })),
    tended: 0,
    shared: 0,
  };
}

function requestedHarvest(agent, index, stock) {
  if (!agent.present) return 0;
  if (agent.botisattva && stock < 48) {
    return Math.min(2, Math.max(0, 4 - agent.reserve));
  }
  const target = agent.botisattva ? 6 : 8 + (index % 3);
  return Math.min(3, Math.max(0, target + 1 - agent.reserve));
}

export function nextDay(orchard, freeTime) {
  if (orchard.day >= DAYS) return;
  const { agents } = orchard;
  const requests = agents.map((agent, index) => requestedHarvest(agent, index, orchard.stock));
  const totalRequested = requests.reduce((sum, amount) => sum + amount, 0);
  const availableShare = totalRequested ? Math.min(1, orchard.stock / totalRequested) : 0;
  let stock = Math.max(0, orchard.stock - totalRequested);
  let tending = 0;

  agents.forEach((agent, index) => {
    const harvest = requests[index] * availableShare;
    agent.reserve += harvest;
    agent.action = harvest > 0 ? "Harvested" : "";
  });

  if (freeTime) {
    const startingIndex = orchard.day % AGENT_COUNT;
    for (let offset = 0; offset < AGENT_COUNT; offset++) {
      const agent = agents[(startingIndex + offset) % AGENT_COUNT];
      if (!agent.present || !agent.botisattva || agent.reserve < 5) continue;
      const neighborLowOnFood = agents.find(neighbor => neighbor.present && neighbor.reserve < 4);
      if (neighborLowOnFood) {
        agent.reserve -= 1;
        neighborLowOnFood.reserve += 1;
        agent.action = "Shared";
        orchard.shared++;
      } else if (stock + tending < 84) {
        agent.reserve -= 1;
        tending += 2.6;
        agent.action = "Tended";
        orchard.tended++;
      }
    }
  }

  for (const agent of agents) {
    if (!agent.present) continue;
    if (agent.reserve >= 1 - 1e-8) {
      agent.reserve = Math.max(0, agent.reserve - 1);
      agent.hungryDays = 0;
    } else {
      agent.reserve = 0;
      agent.hungryDays++;
      if (agent.hungryDays >= 2) {
        agent.present = false;
        agent.action = "Left";
      }
    }
  }

  const growth = isDry(orchard.day + 1) ? 0.07 : 0.31;
  stock += growth * stock * (1 - stock / CAPACITY);
  orchard.stock = Math.min(CAPACITY, stock + tending);
  orchard.day++;
}

export function isDry(day) {
  return day >= DRY_SPELL.firstDay && day <= DRY_SPELL.lastDay;
}

export function remaining(orchard) {
  return orchard.agents.filter(agent => agent.present).length;
}
