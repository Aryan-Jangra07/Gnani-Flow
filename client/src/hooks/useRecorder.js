import { useRef, useState, useEffect } from 'react';
import { blobToWav } from '../lib/wav.js';

const MAX_SECONDS = 29; // Prisma REST takes max 30 sec

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [stream, setStream] = useState(null);
  const recorderRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => () => clearInterval(tickRef.current), []);

  async function start() {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(media);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorderRef.current = { recorder, chunks, media };
    recorder.start();

    setStream(media);
    setSeconds(0);
    setRecording(true);

    const startedAt = Date.now();
    tickRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS && recorder.state === 'recording') recorder.stop();
    }, 250);
  }

  function stop() {
    const current = recorderRef.current;
    if (!current) return Promise.resolve(null);

    clearInterval(tickRef.current);

    return new Promise((resolve, reject) => {
      const { recorder, chunks, media } = current;

      const finish = async () => {
        media.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setStream(null);
        recorderRef.current = null;
        try {
          resolve(await blobToWav(new Blob(chunks, { type: recorder.mimeType })));
        } catch (err) {
          reject(err);
        }
      };

      if (recorder.state === 'inactive') finish();
      else {
        recorder.onstop = finish;
        recorder.stop();
      }
    });
  }

  return { recording, seconds, stream, maxSeconds: MAX_SECONDS, start, stop };
}
