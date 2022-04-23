import { makeEventListener } from "@solid-primitives/event-listener";
import { Accessor, createSignal } from "solid-js";

/**
 * Attaches event listeners and fires callback whenever `window.onLine` changes.
 * @param callback fired whenever `window.onLine` changes
 * @returns function clearing event listeners
 * @example
 * const clear = makeConnectivityListener(isOnline => {
 *    console.log(isOnline) // T: booelan
 * });
 * // remove event listeners (happens also on cleanup)
 * clear()
 */
export function makeConnectivityListener(callback: (isOnline: boolean) => void): VoidFunction {
  const clear1 = makeEventListener(window, "online", callback.bind(void 0, true));
  const clear2 = makeEventListener(window, "offline", callback.bind(void 0, false));
  return () => (clear1(), clear2());
}

/**
 * A signal representing the browser's interpretation of whether it is on- or offline.
 *
 * @return Returns a signal representing the online status. Read-only.
 * @example
 * const isOnline = createConnectivitySignal()
 * isOnline() // T: boolean
 */
export function createConnectivitySignal(): Accessor<boolean> {
  const [status, setStatus] = createSignal<boolean>(navigator.onLine);
  makeConnectivityListener(setStatus);
  return status;
}
