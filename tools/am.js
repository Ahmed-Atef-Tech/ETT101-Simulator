const A = window.__app; const w = A.wires, s = A.sim, sc = A.scope;
w.clearAll();
w.addLead('master.SINE2','adder.A','yellow'); w.addLead('vdc.VDC','adder.B','blue');
w.addLead('adder.OUT','mult1.XDC','red'); w.addLead('master.SINE100','mult1.YDC','black');
s.mods.vdc.set('VDC', 0.5 - 1/5); s.mods.adder.set('g', 0.5); s.mods.adder.set('G', 0.125);
w.setProbe('CH1','master.SINE2'); w.setProbe('CH2','mult1.KXY');
A.panel.refreshAll();
sc.st.td = 8; sc.st.ch.CH1.vd = 9; sc.st.ch.CH2.vd = 9; sc.st.ch.CH1.pos = 2; sc.st.ch.CH2.pos = -1.5; sc.st.meas.src='CH2';
