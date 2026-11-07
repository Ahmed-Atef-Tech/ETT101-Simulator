const A = window.__app; const w = A.wires, s = A.sim, sc = A.scope;
w.clearAll(); s.mods.vco.set('HI',0); s.mods.vco.set('FREQ', Math.log(10)/Math.log(17)); s.mods.vco.set('GAIN', 0.4);
w.addLead('master.SINE2','vco.IN','yellow'); w.setProbe('CH1','master.SINE2'); w.setProbe('CH2','vco.SINE'); A.panel.refreshAll();
sc.st.td = 10; sc.st.math.on = true; sc.st.math.kind='FFT'; sc.st.math.fftSrc='CH2'; sc.st.menu='MATH'; sc.st.ch.CH1.pos=2.5; sc.st.ch.CH2.pos=1; s.setHeadphones(true);
