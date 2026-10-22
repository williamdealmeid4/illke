// Node's watch mode can also emit dependency notifications through worker messages.
export const SIMULATION_MESSAGE = 'illke:simulation-result';
export function isSimulationMessage(message) {
  return message !== null && typeof message === 'object' &&
    message.type === SIMULATION_MESSAGE &&
    (Object.hasOwn(message, 'result') || Object.hasOwn(message, 'error'));
}
