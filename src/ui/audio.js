// Headphone output and microphone input through Web Audio (48 kHz).
export class Audio {
  constructor(sim) { this.sim = sim; this.ctx = null; this.micOn = false; this.muted = false; this.micErr = null; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ sampleRate: 48000, latencyHint: 'interactive' });
      const sp = this.ctx.createScriptProcessor(2048, 1, 2);
      sp.onaudioprocess = e => {
        const inp = e.inputBuffer.getChannelData(0); if (this.micOn) this.sim.mic.push(inp);
        const L = e.outputBuffer.getChannelData(0), R = e.outputBuffer.getChannelData(1), sim = this.sim;
        const on = sim.headphones && !this.muted;
        for (let i = 0; i < L.length; i++) { let v = sim.audioPull(); v = on ? Math.max(-1, Math.min(1, v)) : 0; L[i] = R[i] = v; }
      };
      this.silent = this.ctx.createGain(); this.silent.gain.value = 0;
      const osc = this.ctx.createConstantSource ? this.ctx.createConstantSource() : null;
      if (osc) { osc.offset.value = 0; osc.connect(sp); osc.start(); }
      sp.connect(this.ctx.destination); this.sp = sp;
    } catch (e) { console.warn('audio unavailable', e); }
  }
  async startMic() {
    if (this.micOn || this.micReq) return; this.micReq = true; this.ensure();
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
      const src = this.ctx.createMediaStreamSource(st); src.connect(this.sp); this.micOn = true;
    } catch (e) { this.micErr = e.message || String(e); }
    this.micReq = false;
  }
}
