// ─── SDP Munging ────────────────────────────────────────────────────────────
// Opus codec ke fmtp line ko manually patch karta hai (offer/answer create hone
// ke baad, setLocalDescription se pehle call hota hai).
export const optimizeAudioSDP = (sdp) => {
  return sdp.replace(/a=fmtp:(\d+) (.*)/g, (match, payloadType, existingParams) => {
    if (match.includes("opus")) {
      // maxaveragebitrate=51200 -> Studio-quality voice profile
      // stereo=0 & sprop-stereo=0 -> Optimization for clean single-mic streams
      // usedtx=1 -> Saves massive peer bandwidth by not transmitting absolute silence
      return `a=fmtp:${payloadType} maxaveragebitrate=51200;stereo=0;sprop-stereo=0;usedtx=1;cbr=0`;
    }
    return match;
  });
};