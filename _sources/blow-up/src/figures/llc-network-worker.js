import { lnRun } from "./llc-network.js";
self.onmessage = ({ data: { gamma, job } }) => {
  try {
    for (let H = 1; H <= 5; H++) {
      const value = lnRun(H, gamma, 100 + H * 13, (phase, chain) => {
        self.postMessage({ type: "progress", job, H, phase, chain });
      });
      if (!Number.isFinite(value)) throw new Error("The sampler produced a non-finite estimate.");
      self.postMessage({ type: "result", job, H, value });
    }
    self.postMessage({ type: "complete", job });
  } catch (error) {
    self.postMessage({ type: "error", job, message: error.message });
  }
};
