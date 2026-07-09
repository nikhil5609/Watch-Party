// ─── ICE config ───────────────────────────────────────────────────────────────
// STUN servers -> discover our public IP/port (address discovery only)
// TURN servers -> relay fallback jab direct P2P connection na ban paaye
//                 (strict NAT / firewall ke peeche)
export const buildIceServers = () => {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "f5c241b67512e7a3754b355f",
      credential: "si5pp6D8aRyqd0fa",
    },
  ];
  return { iceServers: servers };
};