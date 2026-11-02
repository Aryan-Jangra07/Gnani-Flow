import { useEffect, useRef } from 'react';

// Live mic level bars while recording
export default function Waveform({ stream }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);

    const canvas = canvasRef.current;
    const g = canvas.getContext('2d');
    const data = new Uint8Array(analyser.frequencyBinCount);
    const history = new Array(48).fill(0);
    let frame;
    let last = 0;

    const draw = (t) => {
      frame = requestAnimationFrame(draw);
      if (t - last < 50) return;
      last = t;

      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
      history.shift();
      history.push(Math.min(1, peak / 64));

      const { width, height } = canvas;
      const barW = width / history.length;
      g.clearRect(0, 0, width, height);
      g.fillStyle = getComputedStyle(canvas).color;
      history.forEach((level, i) => {
        const h = Math.max(2, level * height);
        g.fillRect(i * barW + 1, (height - h) / 2, barW - 2, h);
      });
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      ctx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} className="wave" width={288} height={40} />;
}
