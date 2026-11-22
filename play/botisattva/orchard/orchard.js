import { AGENT_COUNT, CAPACITY, DAYS, DRY_SPELL, isDry, newOrchard, nextDay, remaining } from "./model.mjs";

const controls = document.getElementById("controls");
const mix = document.getElementById("mix");
const mixCount = document.getElementById("mix-count");
const freeTime = document.getElementById("free-time");
const run = document.getElementById("run");
const step = document.getElementById("step");
const reset = document.getElementById("reset");
const season = document.getElementById("season");
const stock = document.getElementById("stock");
const remainingCount = document.getElementById("remaining");
const weather = document.getElementById("weather");
const comparison = document.getElementById("comparison");
const actions = document.getElementById("actions-taken");
const result = document.getElementById("result");
const announcement = document.getElementById("announcement");
const chart = document.getElementById("chart");
const canvas = chart.getContext("2d");

const agentList = document.getElementById("agents");
const agentCards = Array.from({ length: AGENT_COUNT }, (_, index) => {
  const card = document.createElement("li");
  card.className = "agent";
  card.innerHTML = `
    <span class="agent-id"><span>${index + 1}</span><span class="bot-mark" aria-hidden="true">B</span></span>
    <strong class="agent-reserve"></strong>
    <span class="agent-action"></span>`;
  agentList.append(card);
  return {
    card,
    reserve: card.querySelector(".agent-reserve"),
    action: card.querySelector(".agent-action"),
  };
});

let orchard;
let baseline;
let orchardHistory;
let baselineHistory;
let timer = null;

function drawChart() {
  if (!canvas) return;
  const { width, height } = chart.getBoundingClientRect();
  if (width === 0 || height === 0) return;

  const scale = Math.min(window.devicePixelRatio || 1, 2);
  chart.width = Math.round(width * scale);
  chart.height = Math.round(height * scale);
  canvas.setTransform(scale, 0, 0, scale, 0, 0);

  const left = 33;
  const right = width - 12;
  const top = 10;
  const bottom = height - 28;
  const x = day => left + (right - left) * day / DAYS;
  const y = fruit => bottom - (bottom - top) * fruit / CAPACITY;

  canvas.fillStyle = "#f2e6c1";
  canvas.fillRect(x(DRY_SPELL.firstDay - 0.5), top, x(DRY_SPELL.lastDay + 0.5) - x(DRY_SPELL.firstDay - 0.5), bottom - top);
  canvas.strokeStyle = "#ccd1bf";
  canvas.fillStyle = "#506055";
  canvas.font = "13px system-ui, sans-serif";
  canvas.textAlign = "right";
  canvas.textBaseline = "middle";
  for (const fruit of [0, 40, 80, CAPACITY]) {
    canvas.beginPath();
    canvas.moveTo(left, y(fruit));
    canvas.lineTo(right, y(fruit));
    canvas.stroke();
    canvas.fillText(String(fruit), left - 5, y(fruit));
  }
  canvas.textAlign = "center";
  for (const day of [0, 10, 20, DAYS]) {
    canvas.fillText(String(day), x(day), bottom + 13);
  }

  function trace(points, color, dashed) {
    canvas.strokeStyle = color;
    canvas.fillStyle = color;
    canvas.lineWidth = 3;
    canvas.lineJoin = "round";
    canvas.setLineDash(dashed ? [5, 5] : []);
    if (points.length === 1) {
      canvas.beginPath();
      canvas.arc(x(0), y(points[0]), 4, 0, Math.PI * 2);
      canvas.fill();
      return;
    }
    canvas.beginPath();
    canvas.moveTo(x(0), y(points[0]));
    for (let day = 1; day < points.length; day++) {
      canvas.lineTo(x(day), y(points[day]));
    }
    canvas.stroke();
  }

  trace(orchardHistory, "#21634c", false);
  trace(baselineHistory, "#733843", true);
  canvas.setLineDash([]);
}

function updateControls() {
  run.textContent = timer !== null ? "Pause" : orchard.day === DAYS ? "Play again" : "Play season";
  step.disabled = timer !== null || orchard.day === DAYS;
}

function render() {
  const { day } = orchard;
  const bots = Number(mix.value);
  const fruit = Math.round(orchard.stock);
  const present = remaining(orchard);

  mixCount.value = `${bots} of ${AGENT_COUNT} · ${Math.round(bots / AGENT_COUNT * 100)}%`;
  mix.setAttribute("aria-valuetext", `${bots} of ${AGENT_COUNT} agents`);
  season.textContent = `Day ${day} of ${DAYS}`;
  stock.firstChild.nodeValue = `${fruit} `;
  remainingCount.firstChild.nodeValue = `${present} `;
  weather.textContent = isDry(day)
    ? `Dry spell · day ${day - DRY_SPELL.firstDay + 1} of ${DRY_SPELL.lastDay - DRY_SPELL.firstDay + 1}`
    : day > DRY_SPELL.lastDay ? "Dry spell over" : "Dry spell on days 10–19";
  comparison.textContent = day === 0 ? "Both orchards start with 84 fruit and 12 agents."
    : `At day ${day}, the orchard with zero botisattvas has ${Math.round(baseline.stock)} fruit and ${remaining(baseline)} agents.`;
  actions.textContent = `Tending actions ${orchard.tended} · Rations shared ${orchard.shared}`;

  orchard.agents.forEach((agent, index) => {
    const { card, reserve, action } = agentCards[index];
    const amount = Number(agent.reserve.toFixed(1));
    const status = !agent.present ? "Left" : agent.hungryDays ? "Missed meal" : agent.action;
    card.dataset.botisattva = agent.botisattva;
    card.dataset.present = agent.present;
    card.dataset.hungry = agent.present && agent.hungryDays > 0;
    reserve.textContent = agent.present ? String(amount) : "–";
    action.textContent = status;
    const food = `${amount} ${amount === 1 ? "ration" : "rations"}`;
    const description = agent.present ? [food, status].filter(Boolean).join(". ") : "Left the orchard";
    card.setAttribute("aria-label", `Agent ${index + 1}${agent.botisattva ? ", botisattva" : ""}. ${description}.`);
  });

  if (day === DAYS) {
    const goalMet = present === AGENT_COUNT && orchard.stock >= 40;
    result.textContent = `${goalMet ? "Goal met." : "Season complete."} ${present} of ${AGENT_COUNT} agents remain, with ${fruit} fruit in the orchard.`;
  } else {
    result.textContent = "Try to finish day 30 with all twelve agents and at least 40 fruit left.";
  }

  drawChart();
  updateControls();
}

function pause() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

function startOver() {
  pause();
  orchard = newOrchard(Number(mix.value));
  baseline = newOrchard(0);
  orchardHistory = [orchard.stock];
  baselineHistory = [baseline.stock];
  render();
}

function advance(manual = false) {
  nextDay(orchard, freeTime.checked);
  nextDay(baseline, freeTime.checked);
  orchardHistory.push(orchard.stock);
  baselineHistory.push(baseline.stock);
  if (orchard.day === DAYS) pause();
  render();

  if (orchard.day === DAYS) announcement.textContent = result.textContent;
  else if (manual) {
    announcement.textContent = `Day ${orchard.day}. ${Math.round(orchard.stock)} fruit. ${remaining(orchard)} agents remain.`;
  }
}

run.addEventListener("click", () => {
  if (timer !== null) pause();
  else {
    if (orchard.day === DAYS) startOver();
    timer = window.setInterval(advance, 360);
    advance();
  }
  updateControls();
});
step.addEventListener("click", () => advance(true));
function resetFromControls() {
  startOver();
  announcement.textContent = `New season. ${mix.value} botisattvas. Free time ${freeTime.checked ? "on" : "off"}.`;
}
reset.addEventListener("click", resetFromControls);
mix.addEventListener("input", resetFromControls);
freeTime.addEventListener("change", resetFromControls);

startOver();
controls.disabled = false;
new ResizeObserver(drawChart).observe(chart);
