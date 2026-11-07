const A = window.__app; const w = A.wires, s = A.sim, sc = A.scope;
w.clearAll(); const L=(a,b,c)=>w.addLead(a,b,c);
L('master.SINE2','phase.IN','yellow'); L('phase.OUT','mult1.XDC','yellow'); L('master.COS100','mult1.YDC','black'); L('master.SINE2','mult2.XDC','yellow'); L('master.SINE100','mult2.YDC','black');
L('mult2.KXY','adder.A','red'); L('mult1.KXY','adder.B','blue'); s.mods.adder.set('G',0.5); s.mods.adder.set('g',0.5); s.mods.phase.set('PHASE',0.5);
L('adder.OUT','mult3.XDC','red'); L('master.SINE100','mult3.YDC','black'); L('mult3.KXY','tlpf.IN','green'); s.mods.tlpf.set('FC',0.6);
w.setProbe('CH1','adder.OUT'); w.setProbe('CH2','tlpf.OUT'); A.panel.refreshAll();
sc.st.td = 7; sc.st.ch.CH1.vd = 9; sc.st.ch.CH1.pos = 1.5; sc.st.ch.CH2.vd = 8; sc.st.ch.CH2.pos = -2; sc.st.trig.src='CH2'; sc.st.meas.src='CH1'; sc.st.meas.items=['Vpp','Freq',null]; sc.st.menu='HMENU';
