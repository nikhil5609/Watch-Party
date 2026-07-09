// optimizeVideo.js
import { getFFmpeg } from './loadffmpeg';
import { fetchFile } from '@ffmpeg/util';

export async function optimizeVideoClient(file) {
  const ffmpeg = await getFFmpeg();
  
  const inputName = 'input.mp4';
  const outputName = 'output.mp4';
  
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  
  await ffmpeg.exec([
    '-i', inputName,
    '-movflags', '+faststart',
    '-c:v', 'copy',
    '-c:a', 'copy',
    outputName,
  ]);
  
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  
  // cleanup virtual FS
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  
  return new File([blob], file.name, { type: 'video/mp4' });
}