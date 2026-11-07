// Front-panel geometry. Coordinates are taken from the original front-panel artwork (1331 x 1022 px reference),
// so every module, socket, knob and label sits exactly where students see it on the real board.

// ---- module frames (top row y 73..494, bottom row y 547..972) ----
export const FRAMES = [
  // top row
  [65, 73, 188, 494], [188, 73, 310, 320], [188, 320, 310, 494], [310, 73, 435, 494], [435, 73, 558, 494],
  [558, 73, 683, 284], [558, 284, 683, 494], [683, 73, 808, 316], [683, 316, 808, 494], [808, 73, 932, 494],
  [932, 73, 1057, 280], [932, 280, 1057, 350], [932, 350, 1057, 422], [932, 422, 1057, 494], [1057, 73, 1183, 494],
  // bottom row
  [65, 547, 188, 795], [65, 795, 188, 856], [65, 856, 188, 972], [188, 547, 312, 972], [312, 547, 436, 830], [312, 830, 436, 972],
  [436, 547, 560, 972], [560, 547, 685, 972], [685, 547, 810, 756], [685, 756, 810, 972], [810, 547, 933, 972], [933, 547, 1183, 972],
];

// ---- module blocks: used for the (i) info buttons and highlighting ----
export const BLOCKS = {
  adder: [65, 73, 188, 494], mult1: [188, 73, 310, 320], mult2: [188, 320, 310, 494], tpg: [310, 73, 435, 494], das: [435, 73, 558, 494],
  noise: [558, 73, 683, 284], buffer: [558, 284, 683, 494], channel: [683, 73, 808, 316], adder2: [683, 316, 808, 494], phase: [808, 73, 932, 494],
  util: [932, 73, 1057, 494], tlpf: [1057, 73, 1183, 494],
  vdc: [65, 547, 188, 795], speech: [65, 795, 188, 856], exor: [65, 856, 188, 972], vco: [188, 547, 312, 972], seq: [312, 547, 436, 830], div: [312, 830, 436, 972],
  pcmenc: [436, 547, 560, 972], master: [560, 547, 685, 972], mult3: [685, 547, 810, 756], s2p: [685, 756, 810, 972], pcmdec: [810, 547, 933, 972], expansion: [933, 547, 1183, 972],
};

// ---- sockets: id -> [x, y] ----
export const SOCKET_POS = {
  'adder.A': [96, 320], 'adder.B': [96, 461], 'adder.OUT': [157, 461],
  'mult1.XDC': [218, 179], 'mult1.XAC': [218, 214], 'mult1.YDC': [218, 249], 'mult1.YAC': [218, 284], 'mult1.KXY': [280, 284],
  'mult2.XDC': [218, 390], 'mult2.YDC': [219, 461], 'mult2.KXY': [280, 461],
  'tpg.Q2': [403, 319], 'tpg.CLK': [342, 460], 'tpg.Q1': [404, 460],
  'das.SHIN': [465, 177], 'das.SH': [527, 177], 'das.IN1': [465, 247], 'das.C1': [465, 319], 'das.C2': [465, 390], 'das.IN2': [465, 461], 'das.OUT': [527, 461],
  'noise.N0': [650, 176], 'noise.N6': [651, 211], 'noise.N20': [651, 246],
  'buffer.IN': [590, 423], 'buffer.OUT': [652, 423],
  'channel.BPF_IN': [713, 176], 'channel.BPF': [775, 176], 'channel.BB_IN': [713, 246], 'channel.BB': [775, 246],
  'adder2.NOISE': [714, 352], 'adder2.SIGNAL': [713, 423], 'adder2.OUT': [775, 423],
  'phase.IN': [838, 423], 'phase.OUT': [900, 423],
  'util.REF': [961, 176], 'util.CIN': [961, 245], 'util.COMP': [1023, 245], 'util.RECT_IN': [961, 315], 'util.RECT': [1024, 315],
  'util.DIODE_IN': [962, 386], 'util.DIODE': [1024, 386], 'util.RC_IN': [963, 458], 'util.RC': [1025, 458],
  'tlpf.FC100': [1149, 173], 'tlpf.IN': [1087, 457], 'tlpf.OUT': [1151, 457],
  'gnd1': [312, 521], 'gnd2': [808, 520],
  'vdc.P5': [157, 616], 'vdc.VDC': [157, 651], 'vdc.GND': [157, 687],
  'speech.OUT': [157, 829],
  'exor.A': [96, 900], 'exor.B': [96, 936], 'exor.OUT': [157, 936],
  'vco.DIG': [281, 615], 'vco.IN': [219, 900], 'vco.SINE': [281, 900],
  'seq.LINE': [405, 651], 'seq.SYNC': [405, 722], 'seq.X': [405, 757], 'seq.Y': [406, 793], 'seq.CLK': [344, 793],
  'div.IN': [344, 936], 'div.OUT': [406, 936],
  'pcmenc.IN2': [468, 757], 'pcmenc.FS': [530, 757], 'pcmenc.IN1': [468, 829], 'pcmenc.CLK': [469, 900], 'pcmenc.DATA': [531, 900],
  'master.SINE100': [655, 757], 'master.COS100': [655, 793], 'master.DIG100': [655, 829], 'master.DIG8': [655, 864], 'master.DIG2': [656, 900], 'master.SINE2': [656, 935],
  'mult3.XDC': [716, 650], 'mult3.YDC': [716, 721], 'mult3.KXY': [779, 721],
  's2p.SERIAL': [717, 864], 's2p.X1': [780, 864], 's2p.CLK': [718, 935], 's2p.X2': [780, 935],
  'pcmdec.FS': [842, 756], 'pcmdec.DATA': [842, 828], 'pcmdec.OUT2': [904, 827], 'pcmdec.CLK': [843, 899], 'pcmdec.OUT1': [905, 899],
};

// human names of sockets (for tooltips and the guide)
export const SOCKET_NAME = {
  'adder.A': 'ADDER — A', 'adder.B': 'ADDER — B', 'adder.OUT': 'ADDER — GA+gB',
  'mult1.XDC': 'MULTIPLIER — X DC', 'mult1.XAC': 'MULTIPLIER — X AC', 'mult1.YDC': 'MULTIPLIER — Y DC', 'mult1.YAC': 'MULTIPLIER — Y AC', 'mult1.KXY': 'MULTIPLIER — kXY',
  'mult2.XDC': 'MULTIPLIER (2) — X DC', 'mult2.YDC': 'MULTIPLIER (2) — Y DC', 'mult2.KXY': 'MULTIPLIER (2) — kXY',
  'tpg.Q2': 'TWIN PULSE — Q2', 'tpg.CLK': 'TWIN PULSE — CLK', 'tpg.Q1': 'TWIN PULSE — Q1',
  'das.SHIN': 'DUAL ANALOG SW — S&H IN', 'das.SH': 'DUAL ANALOG SW — S&H OUT', 'das.IN1': 'DUAL ANALOG SW — IN 1', 'das.C1': 'DUAL ANALOG SW — CONTROL 1',
  'das.C2': 'DUAL ANALOG SW — CONTROL 2', 'das.IN2': 'DUAL ANALOG SW — IN 2', 'das.OUT': 'DUAL ANALOG SW — OUT',
  'noise.N0': 'NOISE — 0dB', 'noise.N6': 'NOISE — -6dB', 'noise.N20': 'NOISE — -20dB',
  'buffer.IN': 'BUFFER — IN', 'buffer.OUT': 'BUFFER — OUT',
  'channel.BPF_IN': 'CHANNEL BPF — IN', 'channel.BPF': 'CHANNEL BPF — OUT', 'channel.BB_IN': 'BASEBAND LPF — IN', 'channel.BB': 'BASEBAND LPF — OUT',
  'adder2.NOISE': 'ADDER (channel) — NOISE', 'adder2.SIGNAL': 'ADDER (channel) — SIGNAL', 'adder2.OUT': 'ADDER (channel) — CHANNEL OUT',
  'phase.IN': 'PHASE SHIFTER — IN', 'phase.OUT': 'PHASE SHIFTER — OUT',
  'util.REF': 'COMPARATOR — REF', 'util.CIN': 'COMPARATOR — IN', 'util.COMP': 'COMPARATOR — OUT', 'util.RECT_IN': 'RECTIFIER — IN', 'util.RECT': 'RECTIFIER — OUT',
  'util.DIODE_IN': 'DIODE & RC LPF — IN', 'util.DIODE': 'DIODE & RC LPF — OUT', 'util.RC_IN': 'RC LPF — IN', 'util.RC': 'RC LPF — OUT',
  'tlpf.FC100': 'TUNEABLE LPF — fc×100', 'tlpf.IN': 'TUNEABLE LPF — IN', 'tlpf.OUT': 'TUNEABLE LPF — OUT',
  'gnd1': 'GND', 'gnd2': 'GND', 'vdc.GND': 'VARIABLE DCV — GND', 'vdc.P5': 'VARIABLE DCV — +5V', 'vdc.VDC': 'VARIABLE DCV — VDC',
  'speech.OUT': 'SPEECH — OUT', 'exor.A': 'EXOR — A', 'exor.B': 'EXOR — B', 'exor.OUT': 'EXOR — A⊕B',
  'vco.DIG': 'VCO — DIGITAL', 'vco.IN': 'VCO — VCO INPUT', 'vco.SINE': 'VCO — SINE',
  'seq.LINE': 'SEQUENCE GEN — LINE CODE', 'seq.SYNC': 'SEQUENCE GEN — SYNC', 'seq.X': 'SEQUENCE GEN — X', 'seq.Y': 'SEQUENCE GEN — Y', 'seq.CLK': 'SEQUENCE GEN — CLK',
  'div.IN': 'DIVIDER — IN', 'div.OUT': 'DIVIDER — OUT',
  'pcmenc.IN2': 'PCM ENCODER — INPUT 2', 'pcmenc.FS': 'PCM ENCODER — FS', 'pcmenc.IN1': 'PCM ENCODER — INPUT 1', 'pcmenc.CLK': 'PCM ENCODER — CLK', 'pcmenc.DATA': 'PCM ENCODER — PCM DATA',
  'master.SINE100': 'MASTER SIGNALS — 100kHz SINE', 'master.COS100': 'MASTER SIGNALS — 100kHz COS', 'master.DIG100': 'MASTER SIGNALS — 100kHz DIGITAL',
  'master.DIG8': 'MASTER SIGNALS — 8kHz DIGITAL', 'master.DIG2': 'MASTER SIGNALS — 2kHz DIGITAL', 'master.SINE2': 'MASTER SIGNALS — 2kHz SINE',
  'mult3.XDC': 'MULTIPLIER (3) — X DC', 'mult3.YDC': 'MULTIPLIER (3) — Y DC', 'mult3.KXY': 'MULTIPLIER (3) — kXY',
  's2p.SERIAL': 'SERIAL TO PARALLEL — SERIAL', 's2p.X1': 'SERIAL TO PARALLEL — X1', 's2p.CLK': 'SERIAL TO PARALLEL — CLK', 's2p.X2': 'SERIAL TO PARALLEL — X2',
  'pcmdec.FS': 'PCM DECODER — FS', 'pcmdec.DATA': 'PCM DECODER — PCM DATA', 'pcmdec.OUT2': 'PCM DECODER — OUTPUT2', 'pcmdec.CLK': 'PCM DECODER — CLK', 'pcmdec.OUT1': 'PCM DECODER — OUTPUT',
};

// ---- knobs: [module, param, x, y] ----
export const KNOBS = [
  ['adder', 'G', 127, 250], ['adder', 'g', 127, 390],
  ['tpg', 'WIDTH', 373, 250], ['tpg', 'DELAY', 373, 390],
  ['buffer', 'GAIN', 622, 353], ['phase', 'PHASE', 868, 246],
  ['tlpf', 'FC', 1118, 280], ['tlpf', 'GAIN', 1118, 386],
  ['vdc', 'VDC', 127, 759], ['vco', 'GAIN', 250, 687], ['vco', 'FREQ', 250, 757],
];

// ---- slide switches: [module, param, x, y, w, h, labelOn(top)...] value 0 = thumb at top ----
export const SLIDES = [
  ['phase', 'INV', 866, 347], ['vco', 'HI', 251, 865, 'inv'], ['pcmenc', 'TDM', 499, 699],
];
// ---- DIP switches (2 positions each): [module, x, y] (params S1, S2) ----
export const DIPS = [['seq', 343, 647], ['div', 375, 879]];

// ---- LEDs ----
export const LEDS = [['phase', 901, 172], ['pcmdec', 904, 686], ['power', 1070, 520]];

// ---- texts: [x, y, text, size, anchor, weight] ----
const T = (x, y, t, s = 11.5, a = 'middle', w = 400) => [x, y, t, s, a, w];
const TT = (x, y, t) => T(x, y, t, 15.5, 'middle', 500); // module titles
export const TEXTS = [
  TT(127, 101, 'ADDER'), T(127, 314, 'G'), T(96, 349, 'A'), T(128, 457, 'g'), T(96, 490, 'B'), T(157, 490, 'GA+gB'),
  TT(250, 101, 'MULTIPLIER'), T(248, 183, 'DC'), T(248, 218, 'AC'), T(262, 201, 'X', 13), T(248, 253, 'DC'), T(248, 288, 'AC'), T(262, 271, 'Y', 13), T(281, 312, 'kXY'),
  TT(250, 337, 'MULTIPLIER'), T(230, 418, 'X DC'), T(219, 490, 'Y DC'), T(281, 490, 'kXY'),
  TT(373, 100, 'TWIN PULSE'), TT(373, 115, 'GENERATOR'), T(373, 293, 'WIDTH'), T(404, 348, 'Q2'), T(373, 434, 'DELAY'), T(342, 490, 'CLK'), T(404, 490, 'Q1'),
  TT(496, 100, 'DUAL ANALOG'), TT(496, 115, 'SWITCH'), T(465, 203, 'S&H'), T(465, 214, 'IN'), T(527, 203, 'S&H'), T(527, 214, 'OUT'), T(468, 276, 'IN 1'),
  T(479, 346, 'CONTROL 1'), T(479, 369, 'CONTROL 2'), T(465, 490, 'IN 2'), T(527, 490, 'OUT'),
  TT(620, 100, 'NOISE'), TT(620, 115, 'GENERATOR'), T(615, 180, '0dB'), T(615, 215, '-6dB'), T(613, 250, '-20dB'),
  TT(622, 301, 'BUFFER'), T(622, 392, 'GAIN'), T(590, 453, 'IN'), T(652, 453, 'OUT'),
  TT(745, 100, 'CHANNEL'), TT(745, 115, 'MODULE'), T(744, 206, 'CHANNEL'), T(744, 217, 'BPF'), T(744, 274, 'BASEBAND'), T(744, 285, 'LPF'),
  TT(746, 334, 'ADDER'), T(715, 381, 'NOISE'), T(713, 452, 'SIGNAL'), T(774, 452, 'CHANNEL'), T(774, 463, 'OUT'),
  TT(868, 98, 'PHASE'), TT(868, 113, 'SHIFTER'), T(901, 196, 'LO'), T(868, 289, 'PHASE'), T(910, 331, '0°', 12.5), T(908, 380, '180°', 12.5), T(838, 452, 'IN'), T(900, 452, 'OUT'),
  TT(992, 97, 'UTILITIES'), T(992, 131, 'COMPARATOR', 11), T(961, 153, 'REF'), T(961, 274, 'IN'), T(1023, 274, 'OUT'),
  T(992, 296, 'RECTIFIER'), T(993, 367, 'DIODE & RC LPF'), T(992, 437, 'RC LPF'),
  TT(1117, 96, 'TUNEABLE'), TT(1117, 111, 'LPF'), T(1144, 203, 'f_c×100', 12.5), T(1118, 325, 'f_c', 15), T(1120, 430, 'GAIN'), T(1087, 486, 'IN'), T(1151, 486, 'OUT'),
  T(346, 525, 'GND', 12, 'start'), T(842, 524, 'GND', 12, 'start'), T(1088, 524, 'POWER', 12, 'start'),
  // bottom row
  TT(127, 572, 'VARIABLE'), TT(127, 587, 'DCV'), T(112, 620, '+5V'), T(112, 655, 'VDC'), T(112, 691, 'GND'), T(127, 723, 'VDC'),
  TT(127, 810, 'SPEECH'), TT(142, 876, 'EXOR'), T(97, 879, 'A'), T(97, 965, 'B'), T(157, 965, 'A⊕B'),
  TT(250, 572, 'VCO'), T(282, 643, 'DIGITAL'), T(251, 726, 'GAIN'), T(251, 798, 'FREQ'), T(281, 853, 'HI'), T(281, 880, 'LO'),
  T(220, 928, 'VCO'), T(220, 940, 'INPUT'), T(282, 929, 'SINE'),
  TT(374, 572, 'SEQUENCE'), TT(374, 587, 'GENERATOR'), T(405, 615, 'LINE'), T(405, 627, 'CODE'), T(320, 636, '0'), T(320, 664, '1'),
  T(318, 691, '00 NRZ-L', 11, 'start'), T(318, 703, '01 Bi-Ø', 11, 'start'), T(318, 716, '10 RZ-AMI', 11, 'start'), T(318, 728, '11 NRZ-M', 11, 'start'),
  T(406, 698, 'SYNC'), T(379, 761, 'X'), T(379, 797, 'Y'), T(344, 823, 'CLK'),
  TT(375, 847, 'DIVIDER'), T(345, 965, 'IN'), T(408, 965, 'OUT'),
  TT(498, 572, 'PCM'), TT(498, 587, 'ENCODER'), T(460, 686, 'PCM'), T(460, 721, 'TDM'), T(472, 786, 'INPUT 2'), T(531, 786, 'FS'), T(472, 858, 'INPUT 1'),
  T(470, 929, 'CLK'), T(531, 929, 'PCM'), T(531, 941, 'DATA'),
  TT(622, 570, 'MASTER'), TT(622, 585, 'SIGNALS'),
  T(605, 754, '100kHz', 10.5), T(605, 765, 'SINE', 10.5), T(605, 790, '100kHz', 10.5), T(605, 801, 'COS', 10.5), T(605, 826, '100kHz', 10.5), T(605, 837, 'DIGITAL', 10.5),
  T(605, 861, '8kHz', 10.5), T(605, 872, 'DIGITAL', 10.5), T(605, 897, '2kHz', 10.5), T(605, 908, 'DIGITAL', 10.5), T(605, 933, '2kHz', 10.5), T(605, 944, 'SINE', 10.5),
  TT(755, 571, 'MULTIPLIER'), T(728, 678, 'X DC'), T(717, 749, 'Y DC'), T(779, 749, 'kXY'),
  TT(750, 775, 'SERIAL TO'), TT(750, 790, 'PARALLEL'), T(719, 892, 'SERIAL'), T(781, 892, 'X1'), T(719, 965, 'CLK'), T(781, 965, 'X2'),
  TT(872, 571, 'PCM'), TT(872, 586, 'DECODER'), T(873, 690, 'TDM', 11.5, 'end'), T(842, 786, 'FS'), T(842, 857, 'PCM'), T(842, 869, 'DATA'), T(905, 857, 'OUTPUT2'),
  T(843, 929, 'CLK'), T(906, 929, 'OUTPUT'),
  TT(1059, 570, 'EXPANSION'),
];

// ---- simple line art (internal wiring drawn on the panel): polylines [[x,y],...] ----
export const LINES = [
  // adder
  [[96, 307], [96, 293.5], [118.3, 293.5]], [[137.3, 293.5], [157, 293.5], [157, 432.2]], [[96, 448], [96, 438.4], [118.3, 438.4]], [[137.3, 438.4], [150.8, 438.4]], [[157, 444.6], [157, 448]],
  // dual analog switch
  [[478, 248], [487, 248]], [[510, 248], [530, 248], [530, 416]], [[478, 320], [496, 320], [496, 256]],
  [[478, 390], [496, 390], [496, 410]], [[465, 448], [465, 424], [487, 424]], [[510, 424], [521, 424]], [[530, 433], [530, 448]],
  [[465, 135], [480, 135]], [[512, 135], [527, 135]], [[455, 148], [480, 148]],
  // buffer
  [[603, 423], [611.4, 423]], [[626.2, 423], [639, 423]], [[631.5, 423], [631.5, 468], [639.5, 468]],
  // channel adder
  [[727, 352], [752, 352], [752, 380]], [[726, 423], [752, 423], [752, 395]], [[759, 387], [775, 387], [775, 410]],
  // channel filters (stubs)
  [[726, 176], [730, 176]], [[758, 176], [762, 176]], [[726, 246], [730, 246]], [[758, 246], [762, 246]],
  // comparator
  [[961, 189], [961, 204], [980, 204]], [[961, 232], [961, 216], [980, 216]], [[1005, 210], [1023, 210], [1023, 232]],
  // exor
  [[109, 900], [121, 900]], [[145, 900], [157, 900], [157, 923]], [[109, 936], [133, 936], [133, 912]],
  // divider
  [[357, 936], [362, 936]], [[390, 936], [393, 936]],
];
// dashed line of the S&H control
export const DASHED = [[[452, 320], [442, 320], [442, 148], [455, 148]]];

// ---- symbols: [type, x, y] ----
export const SYMBOLS = [
  ['add', 127, 143], ['mul', 250, 143], ['mul', 250, 364], ['tpg', 373, 143], ['sh', 497, 143], ['noise', 612, 142], ['buf', 622, 317], ['phase', 868, 141],
  ['lpf', 1117, 138], ['vco', 226, 616], ['pcmenc', 498, 617], ['master', 614, 614], ['mul', 747, 615], ['s2p', 750, 822], ['pcmdec', 870, 615],
  ['bpf_s', 744, 176], ['lpf_s', 744, 246], ['sumA', 157, 438.4], ['sum', 530, 425], ['sum', 752, 387], ['comp', 992, 210], ['xor', 133, 900], ['div', 376, 936],
  ['triA', 127.8, 293.5], ['triA', 127.8, 438.4], ['triB', 618.8, 423], ['sw', 498, 248], ['sw', 498, 424], ['arrUp', 496, 251], ['arrDn', 496, 416], ['icon_width', 373, 196], ['icon_delay', 360, 336],
  ['headphone', 610, 468], ['jack', 652, 468], ['mic', 97, 828], ['dsub', 1059, 614],
];
