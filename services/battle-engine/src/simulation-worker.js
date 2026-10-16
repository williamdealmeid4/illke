import { parentPort, workerData } from "node:worker_threads";
import { simulate } from "./simulation.js";
try {
  parentPort.postMessage({ result: await simulate(workerData) });
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
