// ffmpegLoader.js
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let loadingPromise = null;

const CORE_VERSION = '0.12.10'; // match latest per docs
const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`; // esm not umd

export function preloadFFmpeg() {
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    console.log('ffmpeg.wasm ready');
    return ffmpeg;
  })();

  return loadingPromise;
}

export function getFFmpeg() {
  return loadingPromise || preloadFFmpeg();
}