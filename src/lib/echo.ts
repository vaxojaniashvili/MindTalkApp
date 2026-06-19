import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import { API_BASE_URL, PUSHER_CONFIG } from '../constants/api';

// Resolve the actual constructors defensively — under Metro/Hermes the default
// export may arrive wrapped (module namespace), which would make `new X()` throw
// "constructor is not callable".
const EchoCtor: any = (Echo as any)?.default ?? (Echo as any)?.Echo ?? Echo;
const PusherCtor: any = (Pusher as any)?.default ?? Pusher;

let echoInstance: any = null;
let echoToken: string | null = null;

/**
 * Lazily create (and memoize) a Laravel Echo client wired to Reverb.
 * Mirrors the web app's lib/echo.ts. Realtime is best-effort — any failure
 * returns null so callers transparently fall back to polling.
 */
export function getEcho(token: string): any {
  if (!PUSHER_CONFIG.appKey) return null;
  if (typeof EchoCtor !== 'function' || typeof PusherCtor !== 'function') {
    return null;
  }

  // Re-use the instance unless the auth token changed.
  if (echoInstance && echoToken === token) return echoInstance;
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      /* ignore */
    }
    echoInstance = null;
  }

  try {
    const client = new PusherCtor(PUSHER_CONFIG.appKey, {
      wsHost: PUSHER_CONFIG.host,
      wsPort: PUSHER_CONFIG.port,
      wssPort: PUSHER_CONFIG.port,
      forceTLS: PUSHER_CONFIG.scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      cluster: '',
      authorizer: (channel: { name: string }) => ({
        authorize: (
          socketId: string,
          callback: (err: Error | null, data: { auth: string } | null) => void,
        ) => {
          fetch(`${API_BASE_URL}/broadcasting/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((r) => {
              if (!r.ok) throw new Error(`Auth ${r.status}`);
              return r.json();
            })
            .then((data) => callback(null, data as { auth: string }))
            .catch((e) => callback(e as Error, null));
        },
      }),
    });

    echoToken = token;
    echoInstance = new EchoCtor({ broadcaster: 'pusher', client });
    return echoInstance;
  } catch (e) {
    // Realtime unavailable on this runtime — fall back to polling.
    echoInstance = null;
    echoToken = null;
    return null;
  }
}

export function disconnectEcho() {
  try {
    echoInstance?.disconnect();
  } catch {
    /* ignore */
  }
  echoInstance = null;
  echoToken = null;
}
