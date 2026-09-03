# 16 — Offline & Network Synchronization UX

Manufacturing floors occasionally suffer local network dropouts. PrintFlow provides clear, non-intrusive connection feedback:

---

## 1. Connection Banner (`ConnectionBanner.tsx`)

When connection to the FastAPI backend is lost:
- An amber warning banner appears at the top of the application shell:
  `"Core Server Disconnected — Working in cached mode. Trying to reconnect..."`
- A **Retry Now** button allows manual reconnection attempts.
- The top bar status indicator turns red (`Core Server Disconnected`).

---

## 2. Reconnection Recovery

The `useConnection` hook polls the `/health` endpoint periodically:
- As soon as the network or backend returns online, the banner dismisses automatically.
- Transient in-flight actions are synced without requiring an application restart.
