import { parentPort, workerData } from "node:worker_threads";
import { SIMULATION_MESSAGE } from "./simulation-protocol.js";
import { simulate } from "./simulation.js";
try {
  parentPort.postMessage({ type: SIMULATION_MESSAGE, result: await simulate(workerData) });
} catch (error) {
  parentPort.postMessage({ type: SIMULATION_MESSAGE, error: error.message });
}
