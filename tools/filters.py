import numpy as np, scipy.signal as s, json
FS=4.8e6
# 1) Tuneable LPF prototype: 8th order elliptic, 0.5dB ripple, 50dB stop, passband edge = 1 rad/s
z,p,k=s.ellip(8,0.3,60,1.0,analog=True,output='zpk')
w=np.logspace(-1,1,20000); _,h=s.freqs_zpk(z,p,k,w)
db=20*np.log10(abs(h)); 
print('ellip8: stop edge(-50dB) ratio', w[np.argmax((db<-49.9)&(w>1))], ' -3dB at', w[np.argmax(db<-3)])
# 2) Channel BPF: 6th order Chebyshev I 0.1dB, 88-112kHz
sos_bpf=s.cheby1(3,0.1,[88e3,112e3],btype='band',fs=FS,output='sos')
f=[30e3,88e3,100e3,112e3,170e3]; _,hb=s.sosfreqz(sos_bpf,worN=f,fs=FS); print('BPF dB',np.round(20*np.log10(abs(hb)),2))
# 3) Baseband LPF: 4th order Butterworth 1.6kHz gain 0.9
sos_bb=s.butter(4,1.6e3,fs=FS,output='sos'); sos_bb[0,:3]*=0.9
_,hh=s.sosfreqz(sos_bb,worN=[100,1600,2083],fs=FS); print('BB dB',np.round(20*np.log10(abs(hh)),2))
# 4) Noise shaping: white -> bandpass 10Hz..240kHz (2nd order butter bandpass)
sos_noise=s.butter(2,[10,240e3],btype='band',fs=FS,output='sos')
# 5) Speech bandpass 300-3k (2nd order)
sos_sp=s.butter(2,[300,3000],btype='band',fs=FS,output='sos')
out=dict(FS=FS, ellipProto=dict(z=[[c.real,c.imag] for c in z],p=[[c.real,c.imag] for c in p],k=float(k)),
 bpf=sos_bpf.tolist(), bb=sos_bb.tolist(), noise=sos_noise.tolist(), speech=sos_sp.tolist())
# noise rms gain of noise filter for unit white -> compute to normalize
imp=np.zeros(2_000_000); imp[0]=1; y=s.sosfilt(sos_noise,imp); out['noiseGain']=float(np.sqrt(np.sum(y**2)))
print('noise filt rms gain',out['noiseGain'])
open('../src/engine/filterdata.js','w').write('export default '+json.dumps(out)+';\n')
