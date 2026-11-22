import { isDry } from "./model.mjs";

const NIGHT = "#172541";
const GOLD = "#e8bd4e";
const PAPER = "#f5edcf";
const INK = "#19232b";
const TREE_SITES = [[19, 47], [43, 44], [67, 42], [92, 46], [117, 49], [141, 53]];
const FRUIT_SITES = [[-4, -12], [1, -15], [4, -11], [-1, -8]];

const MOUNTAINS = [
  { color: "#263755", heights: [36, 34, 30, 26, 22, 27, 31, 33, 29, 23, 20, 27, 32, 35, 31, 27, 29, 34, 37, 39] },
  { color: "#34485b", heights: [41, 38, 35, 38, 40, 37, 32, 30, 33, 35, 39, 36, 34, 33, 38, 42, 40, 36, 39, 43] },
];

const TERRACES = [
  { y: 42, from: 51, to: 80 },
  { y: 44, from: 30, to: 55 },
  { y: 46, from: 78, to: 105 },
  { y: 47, from: 8, to: 32 },
  { y: 49, from: 103, to: 131 },
  { y: 53, from: 129, to: 154 },
];

function paint(context) {
  return (color, x, y, width, height) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
}

function tree(fill, x, y, leaf, fruitPixels, index) {
  fill("#414342", x - 7, y - 1, 15, 2);
  fill(INK, x - 2, y - 17, 5, 17);
  fill("#805c47", x - 1, y - 16, 3, 16);
  fill("#aa7951", x + 1, y - 12, 1, 11);

  if (leaf) {
    fill(INK, x - 4, y - 19, 9, 2);
    fill(INK, x - 6, y - 17, 13, 3);
    fill(INK, x - 8, y - 14, 17, 5);
    fill(INK, x - 6, y - 9, 13, 3);
    fill(leaf, x - 3, y - 18, 7, 3);
    fill(leaf, x - 5, y - 16, 11, 4);
    fill(leaf, x - 7, y - 13, 15, 3);
    fill(leaf, x - 5, y - 11, 11, 4);
    fill("#afad72", x - 3, y - 17, 4, 1);
  } else {
    fill("#aa7951", x - 4, y - 12, 3, 2);
    fill("#805c47", x - 6, y - 15, 2, 4);
    fill("#805c47", x + 2, y - 9, 3, 2);
    fill("#aa7951", x + 5, y - 13, 2, 4);
  }

  FRUIT_SITES.forEach(([dx, dy], slot) => {
    if (slot * TREE_SITES.length + index < fruitPixels) {
      fill(GOLD, x + dx, y + dy, 2, 2);
    }
  });
}

export function drawOrchardScene(context, day, stock) {
  if (!context) return;

  const fill = paint(context);
  const dry = isDry(day);
  const fruitPixels = Math.round(stock / 5);
  const leaf = stock === 0 ? null : dry ? "#8b674f" : stock < 36 ? "#667754" : "#527d64";
  fill(dry ? "#29304a" : NIGHT, 0, 0, 160, 64);
  fill(dry ? "#392f43" : "#22324c", 0, 19, 160, 30);

  for (const [x, y, color] of [[8, 12, "#8ba2ad"], [28, 7, PAPER], [51, 14, "#9e6857"], [71, 6, "#819fa0"], [99, 12, PAPER], [151, 8, "#8ba2ad"]]) {
    fill(color, x, y, 1, 1);
  }
  fill(dry ? "#a34f48" : "#b88746", 125, 8, 11, 5);
  fill(dry ? "#bd7354" : GOLD, 127, 6, 7, 9);
  fill(dry ? "#db9968" : PAPER, 128, 7, 3, 2);

  for (const { color, heights } of MOUNTAINS) {
    heights.forEach((height, i) => fill(color, i * 8, height, 8, 64 - height));
  }

  for (const { y, from, to } of TERRACES) {
    fill(dry ? "#674b48" : "#3c5b4e", from, y, to - from, 64 - y);
    fill(dry ? "#b58558" : "#859263", from, y, to - from, 2);
    fill(dry ? "#8e6251" : "#627554", from + 3, y + 5, to - from - 6, 1);
  }

  TREE_SITES.forEach(([x, y], i) => tree(fill, x, y, leaf, fruitPixels, i));

  const water = dry ? "#594757" : "#466984";
  fill(water, 0, 57, 59, 2);
  fill(water, 57, 58, 48, 2);
  fill(water, 103, 59, 57, 2);
  fill(dry ? "#986451" : "#74a0a0", 9, 57, 11, 1);
  fill(dry ? "#986451" : "#74a0a0", 114, 59, 16, 1);
  fill(dry ? "#744443" : "#4b4b3d", 0, 62, 160, 2);
}

const PORTRAIT = [
  "....OOOO....",
  "...OHHHHO...",
  "..OHHHHHHO..",
  "..OOOOOOOO..",
  "...OSSOOO...",
  "...OSSSOO...",
  "....OOOO....",
  "..OORRRROO..",
  "..ORRRRRRO..",
  "..ORRLLRRO..",
  "..OOOOOOOO..",
];

export function drawAgentPortrait(context, agent) {
  if (!context) return;

  const fill = paint(context);
  context.clearRect(0, 0, 12, 11);
  const colors = {
    O: INK,
    H: agent.botisattva ? GOLD : "#8aa5a7",
    S: "#d2a87e",
    R: agent.botisattva ? "#a94e53" : "#527d64",
    L: agent.botisattva ? "#e0a467" : "#92ac82",
  };
  context.globalAlpha = agent.present ? 1 : 0.3;
  PORTRAIT.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (pixel !== ".") fill(colors[pixel], x, y, 1, 1);
    });
  });
  context.globalAlpha = 1;
}
