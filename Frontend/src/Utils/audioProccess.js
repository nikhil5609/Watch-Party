import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor'
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url'
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url'
import rnnoiseWasmSimdPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url'

// ─── Lightweight DSP Processor ──────────────────────────────────────────────
// Swapped Speex -> RNNoise. RNNoise is a small RNN (GRU-based) trained
// specifically for real-time voice denoising — generally cleaner on steady
// background noise (fans, AC, traffic hum) than Speex's classic DSP approach.
// Fixed at 48kHz / 480-sample (10ms) frames internally, same as before.
//
// Chain: mic -> highpass (150Hz) -> RNNoise (AI denoise) -> compressor -> output
export const processMicStream = async (rawStream) => {
  let rnnoiseNode = null
  try {
    const ctx = new AudioContext({ sampleRate: 48000 })
    if (ctx.state === 'suspended') await ctx.resume()

    // RNNoise wasm load karo (SIMD build auto-picked if browser supports it → faster)
    const rnnoiseWasmBinary = await loadRnnoise({
      url: rnnoiseWasmPath,
      simdUrl: rnnoiseWasmSimdPath,
    })
    await ctx.audioWorklet.addModule(rnnoiseWorkletPath)

    const source = ctx.createMediaStreamSource(rawStream)

    const highPass = ctx.createBiquadFilter()
    highPass.type = 'highpass'
    highPass.frequency.value = 150

    // RNNoise AI denoiser: fan/cooler/air/keyboard noise yahan remove hogi
    rnnoiseNode = new RnnoiseWorkletNode(ctx, {
      wasmBinary: rnnoiseWasmBinary,
      maxChannels: 1,
    })

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -24
    compressor.knee.value = 10
    compressor.ratio.value = 2
    compressor.attack.value = 0.005
    compressor.release.value = 0.35

    const dest = ctx.createMediaStreamDestination()

    source.connect(highPass).connect(rnnoiseNode).connect(compressor).connect(dest)

    return { processedStream: dest.stream, audioCtx: ctx, rnnoiseNode }
  } catch (e) {
    console.warn('[WebRTC] Fallback to raw stream:', e)
    return { processedStream: rawStream, audioCtx: null, rnnoiseNode: null }
  }
}