// Lõi FEM — dầm Euler-Bernoulli 2 nút, đơn vị SI (m, N, Pa, N·m, rad).
// Quy ước: x dọc dầm từ trái sang phải, chuyển vị v dương hướng lên,
// góc xoay θ dương ngược chiều kim đồng hồ, mômen uốn dương gây võng
// xuống (sagging), tải phân bố/tập trung dương hướng xuống.
//
// Nội lực M(x), Q(x) được tính bằng cân bằng đoạn dầm bên trái (chính xác,
// không phụ thuộc quy ước dấu của lực nút phần tử). Chuyển vị v(x) trong
// một phần tử = nội suy Hermite từ nút + số hạng tải phân bố khi hai đầu
// ngàm (chính xác cho dầm lăng trụ chịu tải đều từng đoạn).

import { solveLinear } from './math_matrix.js';

const TOL_X = 1e-9;
// Sai số so sánh vị trí trong M(x)/Q(x): Q gián đoạn tại gối/tải tập trung
// nên lấy quy ước liên tục phải — tải/gối tại đúng x được tính vào Q(x).
// EPS phải nhỏ hơn nhiều so với bước lưới để không nuốt điểm kề.
const EPS_X = 1e-12;

/** Ma trận độ cứng phần tử dầm 4×4, bậc tự do [v1, θ1, v2, θ2]. */
export function beamElementStiffness(EI, le) {
  const c = EI / le ** 3;
  return [
    [12 * c, 6 * le * c, -12 * c, 6 * le * c],
    [6 * le * c, 4 * le * le * c, -6 * le * c, 2 * le * le * c],
    [-12 * c, -6 * le * c, 12 * c, -6 * le * c],
    [6 * le * c, 2 * le * le * c, -6 * le * c, 4 * le * le * c],
  ];
}

/**
 * Véc-tơ tải nút tương đương của tải phân bố đều w (N/m, hướng xuống)
 * trên một phần tử, bậc tự do [v1, θ1, v2, θ2], v dương lên, θ dương
 * ngược chiều kim đồng hồ.
 */
export function elementFixedEndLoad(w, le) {
  return [-w * le / 2, -w * le * le / 12, -w * le / 2, w * le * le / 12];
}

function dedupeSorted(xs) {
  const out = [];
  for (const x of [...xs].sort((a, b) => a - b)) {
    if (out.length === 0 || x - out[out.length - 1] > TOL_X) out.push(x);
  }
  return out;
}

/**
 * Giải dầm một nhịp có hai đoạn hẫng (hoặc không hẫng) trên hai gối đơn.
 *
 * @param {object} cfg
 * @param {number} cfg.length_m chiều dài dầm L > 0.
 * @param {[number, number]} cfg.supports_m vị trí hai gối [x1, x2], 0 ≤ x1 < x2 ≤ L.
 * @param {number} cfg.EI_Nm2 độ cứng uốn E·I (N·m²) > 0, không đổi dọc dầm.
 * @param {number} [cfg.uniformLoad_N_per_m=0] tải đều toàn dầm, hướng xuống.
 * @param {Array<{x_m:number,P_N:number}>} [cfg.pointLoads=[]] tải tập trung, P > 0 hướng xuống.
 * @param {Array<{x1_m:number,x2_m:number,w_N_per_m:number}>} [cfg.patchLoads=[]] tải đều trên đoạn.
 * @param {number} [cfg.elementsPerSegment=10] số phần tử mỗi khoảng giữa các điểm đặc biệt.
 */
export function analyseBeam(cfg) {
  const {
    length_m: L,
    supports_m,
    EI_Nm2: EI,
    uniformLoad_N_per_m: w0 = 0,
    pointLoads = [],
    patchLoads = [],
    elementsPerSegment = 10,
  } = cfg;

  if (!(L > 0)) throw new Error(`analyseBeam: L phai > 0 (nhan ${L})`);
  if (!(EI > 0)) throw new Error(`analyseBeam: EI phai > 0 (nhan ${EI})`);
  if (!Array.isArray(supports_m) || supports_m.length !== 2) {
    throw new Error('analyseBeam: can dung 2 goi [x1, x2]');
  }
  const [x1, x2] = supports_m;
  if (!(x1 >= 0 && x2 <= L && x1 < x2)) {
    throw new Error(`analyseBeam: goi khong hop le x1=${x1}, x2=${x2}, L=${L}`);
  }
  if (!Number.isInteger(elementsPerSegment) || elementsPerSegment < 1) {
    throw new Error('analyseBeam: elementsPerSegment phai la so nguyen >= 1');
  }
  for (const p of pointLoads) {
    if (!(p.x_m >= 0 && p.x_m <= L && p.P_N > 0)) {
      throw new Error(`analyseBeam: tai tap trung khong hop le ${JSON.stringify(p)}`);
    }
  }
  for (const p of patchLoads) {
    if (!(p.x1_m >= 0 && p.x2_m <= L && p.x1_m < p.x2_m && p.w_N_per_m > 0)) {
      throw new Error(`analyseBeam: tai vet khong hop le ${JSON.stringify(p)}`);
    }
  }

  // --- Lưới: các điểm đặc biệt + chia nhỏ từng khoảng ---
  const critical = dedupeSorted([
    0, L, x1, x2,
    ...pointLoads.map((p) => p.x_m),
    ...patchLoads.flatMap((p) => [p.x1_m, p.x2_m]),
  ]);
  const nodeXs = [];
  for (let i = 0; i < critical.length - 1; i++) {
    const a = critical[i];
    const b = critical[i + 1];
    for (let k = 0; k < elementsPerSegment; k++) nodeXs.push(a + ((b - a) * k) / elementsPerSegment);
  }
  nodeXs.push(L);
  const nNodes = nodeXs.length;
  const nDof = 2 * nNodes;

  // Tải đều từng phần tử (tự trọng + các vệt tải phủ kín phần tử).
  const elements = [];
  for (let e = 0; e < nNodes - 1; e++) {
    const xa = nodeXs[e];
    const xb = nodeXs[e + 1];
    const xm = (xa + xb) / 2;
    let w = w0;
    for (const p of patchLoads) {
      if (xm > p.x1_m - TOL_X && xm < p.x2_m + TOL_X) w += p.w_N_per_m;
    }
    elements.push({ x1_m: xa, x2_m: xb, length_m: xb - xa, w_N_per_m: w });
  }

  // --- Lắp ráp K, F ---
  const K = Array.from({ length: nDof }, () => new Array(nDof).fill(0));
  const F = new Array(nDof).fill(0);
  for (let e = 0; e < elements.length; e++) {
    const { length_m: le, w_N_per_m: w } = elements[e];
    const ke = beamElementStiffness(EI, le);
    const fe = elementFixedEndLoad(w, le);
    const dofs = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
    for (let i = 0; i < 4; i++) {
      F[dofs[i]] += fe[i];
      for (let j = 0; j < 4; j++) K[dofs[i]][dofs[j]] += ke[i][j];
    }
  }
  for (const p of pointLoads) {
    const idx = nodeXs.findIndex((x) => Math.abs(x - p.x_m) <= TOL_X);
    F[2 * idx] -= p.P_N; // hướng xuống = chiều v âm
  }

  // --- Gối: v = 0 tại hai nút gối ---
  const supportNodeIdx = supports_m.map((xs) => nodeXs.findIndex((x) => Math.abs(x - xs) <= TOL_X));
  const constrained = new Set(supportNodeIdx.map((i) => 2 * i));
  const freeDofs = [];
  for (let d = 0; d < nDof; d++) if (!constrained.has(d)) freeDofs.push(d);
  const Kred = freeDofs.map((i) => freeDofs.map((j) => K[i][j]));
  const Fred = freeDofs.map((i) => F[i]);
  const ured = solveLinear(Kred, Fred);
  const u = new Array(nDof).fill(0);
  freeDofs.forEach((d, k) => { u[d] = ured[k]; });

  // --- Phản lực: R = (K·u − F) tại bậc v của nút gối (dương hướng lên) ---
  const reactions = supportNodeIdx.map((node, k) => {
    const d = 2 * node;
    let s = -F[d];
    for (let j = 0; j < nDof; j++) s += K[d][j] * u[j];
    return { x_m: supports_m[k], R_N: s };
  });

  const nodes = nodeXs.map((x, i) => ({ x_m: x, v_m: u[2 * i], theta_rad: u[2 * i + 1] }));

  // --- Tải phân bố tại một mặt cắt (đều toàn dầm + vệt) ---
  const wAt = (x) => {
    let w = w0;
    for (const p of patchLoads) if (x > p.x1_m - TOL_X && x < p.x2_m + TOL_X) w += p.w_N_per_m;
    return w;
  };

  // Nội lực bằng cân bằng đoạn trái (mômen dương gây võng xuống).
  function bendingMoment(x) {
    if (x < 0 || x > L) throw new Error(`bendingMoment: x=${x} ngoai [0, ${L}]`);
    let M = 0;
    for (const r of reactions) if (r.x_m <= x + EPS_X) M += r.R_N * (x - r.x_m);
    for (const p of pointLoads) if (p.x_m <= x + EPS_X) M -= p.P_N * (x - p.x_m);
    // Tải phân bố trên [0, x]: chia theo các điểm đặc biệt để lấy đúng w từng đoạn.
    const cuts = dedupeSorted([0, x, ...critical.filter((c) => c > 0 && c < x)]);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i];
      const b = cuts[i + 1];
      const w = wAt((a + b) / 2);
      M -= w * (b - a) * (x - (a + b) / 2);
    }
    return M;
  }

  function shearForce(x) {
    if (x < 0 || x > L) throw new Error(`shearForce: x=${x} ngoai [0, ${L}]`);
    let Q = 0;
    for (const r of reactions) if (r.x_m <= x + EPS_X) Q += r.R_N;
    for (const p of pointLoads) if (p.x_m <= x + EPS_X) Q -= p.P_N;
    const cuts = dedupeSorted([0, x, ...critical.filter((c) => c > 0 && c < x)]);
    for (let i = 0; i < cuts.length - 1; i++) {
      Q -= wAt((cuts[i] + cuts[i + 1]) / 2) * (cuts[i + 1] - cuts[i]);
    }
    return Q;
  }

  function elementIndexAt(x) {
    if (x >= L) return elements.length - 1;
    for (let e = 0; e < elements.length; e++) {
      if (x >= elements[e].x1_m - TOL_X && x < elements[e].x2_m - TOL_X) return e;
    }
    return elements.length - 1;
  }

  // Chuyển vị trong phần tử: Hermite từ nút + số hạng tải đều hai đầu ngàm.
  function deflection(x) {
    if (x < 0 || x > L) throw new Error(`deflection: x=${x} ngoai [0, ${L}]`);
    const e = elementIndexAt(x);
    const el = elements[e];
    const le = el.length_m;
    const xi = Math.min(Math.max(x - el.x1_m, 0), le);
    const s = xi / le;
    const v1 = u[2 * e];
    const t1 = u[2 * e + 1];
    const v2 = u[2 * e + 2];
    const t2 = u[2 * e + 3];
    const N1 = 1 - 3 * s * s + 2 * s * s * s;
    const N2 = le * (s - 2 * s * s + s * s * s);
    const N3 = 3 * s * s - 2 * s * s * s;
    const N4 = le * (-s * s + s * s * s);
    const vFixed = (-el.w_N_per_m * xi * xi * (le - xi) * (le - xi)) / (24 * EI);
    return N1 * v1 + N2 * t1 + N3 * v2 + N4 * t2 + vFixed;
  }

  // --- Cực trị (M, Q chính xác theo từng phần tử; v lấy mẫu dày) ---
  let Mmax = { value: -Infinity, x_m: 0 };
  let Mmin = { value: Infinity, x_m: 0 };
  let Qmax = { value: -Infinity, x_m: 0 };
  let Qmin = { value: Infinity, x_m: 0 };
  const considerM = (v, x) => {
    if (v > Mmax.value) Mmax = { value: v, x_m: x };
    if (v < Mmin.value) Mmin = { value: v, x_m: x };
  };
  const considerQ = (v, x) => {
    if (v > Qmax.value) Qmax = { value: v, x_m: x };
    if (v < Qmin.value) Qmin = { value: v, x_m: x };
  };
  for (const el of elements) {
    const { x1_m: xa, x2_m: xb, w_N_per_m: w } = el;
    const Mleft = bendingMoment(xa);
    const Qleft = shearForce(xa + 1e-9);
    considerM(Mleft, xa);
    considerQ(Qleft, xa);
    considerM(bendingMoment(xb), xb);
    considerQ(shearForce(xb - 1e-9), xb);
    // M(x) bậc hai trong phần tử: đỉnh tại Q = 0.
    if (w > 0) {
      const xiStar = Qleft / w;
      if (xiStar > 0 && xiStar < el.length_m) {
        considerM(Mleft + Qleft * xiStar - (w * xiStar * xiStar) / 2, xa + xiStar);
      }
    }
  }
  let vDownMax = { value: -Infinity, x_m: 0 }; // võng xuống lớn nhất (v âm)
  let vUpMax = { value: -Infinity, x_m: 0 };
  for (const el of elements) {
    for (let k = 0; k <= 40; k++) {
      const x = el.x1_m + ((el.x2_m - el.x1_m) * k) / 40;
      const v = deflection(x);
      if (-v > vDownMax.value) vDownMax = { value: -v, x_m: x };
      if (v > vUpMax.value) vUpMax = { value: v, x_m: x };
    }
  }

  // --- Cân bằng toàn hệ ---
  const totalDown = w0 * L
    + pointLoads.reduce((s, p) => s + p.P_N, 0)
    + patchLoads.reduce((s, p) => s + p.w_N_per_m * (p.x2_m - p.x1_m), 0);
  const totalDownMoment = (w0 * L * L) / 2
    + pointLoads.reduce((s, p) => s + p.P_N * p.x_m, 0)
    + patchLoads.reduce((s, p) => s + p.w_N_per_m * (p.x2_m - p.x1_m) * ((p.x1_m + p.x2_m) / 2), 0);
  const sumR = reactions.reduce((s, r) => s + r.R_N, 0);
  const sumRMoment = reactions.reduce((s, r) => s + r.R_N * r.x_m, 0);

  return {
    length_m: L,
    supports_m: [x1, x2],
    EI_Nm2: EI,
    nodes,
    reactions,
    elements,
    bendingMoment,
    shearForce,
    deflection,
    extrema: {
      M_max_Nm: Mmax,
      M_min_Nm: Mmin,
      Q_max_N: Qmax,
      Q_min_N: Qmin,
      deflection_down_max_m: vDownMax,
      deflection_up_max_m: vUpMax,
    },
    equilibrium: {
      sumF_N: sumR - totalDown,
      sumM_Nm: sumRMoment - totalDownMoment,
      totalDown_N: totalDown,
    },
    mesh: { nNodes, nElements: elements.length, elementsPerSegment },
  };
}
