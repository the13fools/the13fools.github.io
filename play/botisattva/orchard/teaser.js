import { AGENT_COUNT, DAYS, newOrchard, nextDay, remaining } from "./model.mjs?v=3";
import { drawOrchardScene } from "./pixel-art.js?v=3";

const preview = document.getElementById("orchard-preview");
const controls = document.getElementById("orchard-preview-controls");
const mix = document.getElementById("orchard-preview-mix");
const count = document.getElementById("orchard-preview-count");
const result = document.getElementById("orchard-preview-result");
const canvas = preview.querySelector("canvas");
const context = canvas.getContext("2d");

function renderSeason() {
  const botisattvas = Number(mix.value);
  const orchard = newOrchard(botisattvas);

  for (let day = 0; day < DAYS; day++) nextDay(orchard, true);

  count.textContent = `${botisattvas} of ${AGENT_COUNT}`;
  mix.setAttribute("aria-valuetext", `${botisattvas} of ${AGENT_COUNT} agents are botisattvas`);
  const present = remaining(orchard);
  result.textContent = `Day ${DAYS}. ${present} of ${AGENT_COUNT} agents remain. ${Math.round(orchard.stock)} fruit left.`;
  drawOrchardScene(context, orchard.day, orchard.stock);
}

mix.addEventListener("input", renderSeason);
renderSeason();
controls.hidden = false;
if (context) {
  canvas.hidden = false;
  preview.dataset.illustrated = "";
}
