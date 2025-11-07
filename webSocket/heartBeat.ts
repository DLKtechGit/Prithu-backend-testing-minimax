import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../apiInterpretor/apiInterceptor";
import { API_CONFIG } from "../config/api.config";

interface HeartbeatResponse {
  message?: string;
  error?: string;
}

/**
 * ✅ Global Singleton Heartbeat State (survives across screen re-renders)
 */
globalThis.__HEARTBEAT_STATE__ = globalThis.__HEARTBEAT_STATE__ || {
  interval: null as NodeJS.Timeout | null,
  active: false,
  failures: 0,
};

const getState = () => globalThis.__HEARTBEAT_STATE__;

const MAX_CONSECUTIVE_FAILURES = 3;

// ✅ Use SAFE Minimum Interval (30 sec)
const DEFAULT_HEARTBEAT_INTERVAL = API_CONFIG.heartbeatInterval || 30000;

export const startHeartbeat = async (customInterval?: number, source: string = "UNKNOWN") => {
  const state = getState();

  // ✅ PROOF LOG — Show who is calling startHeartbeat()
  console.log(`⚠️ startHeartbeat() CALLED from: ${source} at`, new Date().toISOString());

  // ✅ Prevent Duplicate Starts (Proof Logging)
  if (state.active) {
    console.log("⛔ Heartbeat already running — DUPLICATE BLOCKED");
    return;
  }

  console.log("✅ No existing heartbeat, starting new one");

  state.active = true;
  state.failures = 0;

  // ✅ Clear any old interval
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }

  const sendHeartbeat = async () => {
    try {
      const sessionId = await AsyncStorage.getItem("sessionId");
      if (!sessionId) {
        console.warn("⚠️ No sessionId found — stopping heartbeat.");
        stopHeartbeat();
        return;
      }

      // ✅ PROOF — Every heartbeat request
      console.log("📡 Sending Heartbeat Now:", new Date().toISOString(), "session:", sessionId);

      const response = await api.post<HeartbeatResponse>(
        "/api/heartbeat",
        { sessionId },
        { timeout: 10000 }
      );

      if (response.status === 200 && response.data?.message) {
        console.log("✅ Heartbeat success");
        state.failures = 0;
        return;
      }

      throw new Error(response.data?.error || "Unknown heartbeat failure");

    } catch (err: any) {
      console.error("❌ Heartbeat error:", err?.message);

      state.failures++;

      if (err.response?.status === 401) {
        console.log("⛔ Auth failed — Stopping heartbeat");
        stopHeartbeat();
        return;
      }

      if (state.failures >= MAX_CONSECUTIVE_FAILURES) {
        console.log("🔻 Too many failures — Restarting heartbeat later");
        stopHeartbeat();

        setTimeout(() => {
          if (!getState().active) startHeartbeat(customInterval, "AUTO-RESTART");
        }, API_CONFIG.reconnectDelay || 10000);

        return;
      }
    }
  };

  // ✅ Immediate first call
  await sendHeartbeat();

  // ✅ Stable interval (no jitter!)
  const interval = customInterval || DEFAULT_HEARTBEAT_INTERVAL;
  state.interval = setInterval(sendHeartbeat, interval);

  // ✅ PROOF — interval set
  console.log(`⏱️ Heartbeat interval set to every ${interval} ms`);
};


export const stopHeartbeat = () => {
  const state = getState();
  console.log("Stopping heartbeat...");

  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }

  state.active = false;
  state.failures = 0;

  console.log("🛑 Heartbeat stopped.");
};

export const isHeartbeatActive = (): boolean => getState().active;

export const getHeartbeatStatus = () => ({
  active: getState().active,
  failures: getState().failures,
  maxFailures: MAX_CONSECUTIVE_FAILURES,
  interval: DEFAULT_HEARTBEAT_INTERVAL,
});

/**
 * Optional Test Function
 */
export const testHeartbeatConnection = async (): Promise<boolean> => {
  try {
    const sessionId = await AsyncStorage.getItem("sessionId");
    if (!sessionId) return false;
    await api.post("/api/heartbeat", { sessionId }, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};
