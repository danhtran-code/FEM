// Dữ liệu biểu đồ + sơ đồ cho giao diện xep-coc — hàm thuần, test được.
// Không dùng DOM hay Plotly ở đây; app.js chỉ việc vẽ lại dữ liệu này.

/**
 * Lấy mẫu M(x), Q(x), v(x) dọc cọc từ kết quả beam.
 * @param {object} beam kết quả analyseBeam (có bendingMoment/shearForce/deflection).
 * @param {number} nPoints số điểm mẫu (mặc định 241).
 * @returns {{ x_m:number[], M_kNm:number[], Q_kN:number[], vDown_mm:number[] }}
 *   vDown_mm dương hướng xuống (đổi dấu v của solver, vốn dương hướng lên).
 */
export function buildDiagramSeries(beam, nPoints = 241) {
  const L = beam.length_m;
  const x_m = [];
  const M_kNm = [];
  const Q_kN = [];
  const vDown_mm = [];
  for (let i = 0; i < nPoints; i++) {
    const x = (L * i) / (nPoints - 1);
    x_m.push(x);
    M_kNm.push(beam.bendingMoment(x) / 1000);
    Q_kN.push(beam.shearForce(x) / 1000);
    vDown_mm.push(-beam.deflection(x) * 1000);
  }
  return { x_m, M_kNm, Q_kN, vDown_mm };
}

/**
 * Bảng các trạm kiểm tra: đầu cọc, gối 1, giữa nhịp, gối 2, cuối cọc.
 * Q lấy phía phải trạm (quy ước liên tục phải của solver).
 */
export function buildStationTable(beam) {
  const L = beam.length_m;
  const [x1, x2] = beam.supports_m;
  const stations = [
    { label: 'Đầu trái (x = 0)', x_m: 0 },
    { label: 'Gối 1', x_m: x1 },
    { label: 'Giữa nhịp', x_m: (x1 + x2) / 2 },
    { label: 'Gối 2', x_m: x2 },
    { label: 'Đầu phải (x = L)', x_m: L },
  ];
  return stations.map((s) => ({
    ...s,
    M_kNm: beam.bendingMoment(s.x_m) / 1000,
    Q_kN: beam.shearForce(s.x_m) / 1000,
    vDown_mm: -beam.deflection(s.x_m) * 1000,
  }));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Làm tròn hiển thị 2 chữ số để tránh 9.6 − 2.4 = 7.199999999999999 trong nhãn.
const n2 = (v) => String(Math.round(v * 100) / 100);

/**
 * Sơ đồ dọc cọc (SVG, chuỗi thuần): cọc, hai gối, tải tầng trên, phản lực,
 * kích thước a1 / nhịp / a2. Khung 960×250, trục x ánh xạ [0, L] → [70, 890].
 */
export function schematicSvg({ pile_code, L_m, x1_m, x2_m, loads = [], reactions = [], w_kN_per_m }) {
  const W = 960;
  const H = 250;
  const X0 = 70;
  const X1 = 890;
  const Y = 105; // cao độ trục cọc
  const px = (x) => X0 + ((X1 - X0) * x) / L_m;
  const parts = [];
  parts.push(`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto" role="img" aria-label="So do coc ${esc(pile_code)}">`);
  parts.push(`<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#dc2626"/></marker></defs>`);
  // Tự trọng: mũi tên nhỏ đều dọc cọc.
  for (let i = 0; i <= 12; i++) {
    const x = px((L_m * i) / 12);
    parts.push(`<line x1="${x.toFixed(1)}" y1="58" x2="${x.toFixed(1)}" y2="88" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arr)"/>`);
  }
  parts.push(`<text x="480" y="50" text-anchor="middle" font-size="13" fill="#64748b">tự trọng w = ${w_kN_per_m.toFixed(3)} kN/m ↓</text>`);
  // Thân cọc.
  parts.push(`<rect x="${px(0).toFixed(1)}" y="${Y - 8}" width="${(px(L_m) - px(0)).toFixed(1)}" height="16" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>`);
  parts.push(`<text x="480" y="${Y - 18}" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">${esc(pile_code)} — L = ${L_m} m</text>`);
  // Tải tầng trên (đỏ).
  for (const ld of loads) {
    const x = px(ld.x_m);
    if (ld.length_m > 0) {
      const xa = px(ld.x_m - ld.length_m / 2);
      const xb = px(ld.x_m + ld.length_m / 2);
      parts.push(`<line x1="${xa.toFixed(1)}" y1="78" x2="${xb.toFixed(1)}" y2="78" stroke="#dc2626" stroke-width="3"/>`);
      parts.push(`<line x1="${x.toFixed(1)}" y1="78" x2="${x.toFixed(1)}" y2="92" stroke="#dc2626" stroke-width="2" marker-end="url(#arr)"/>`);
      parts.push(`<text x="${x.toFixed(1)}" y="70" text-anchor="middle" font-size="12" fill="#dc2626">P = ${(ld.P_N / 1000).toFixed(1)} kN / ${(ld.length_m).toFixed(2)} m</text>`);
    } else {
      parts.push(`<line x1="${x.toFixed(1)}" y1="62" x2="${x.toFixed(1)}" y2="92" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arr)"/>`);
      parts.push(`<text x="${x.toFixed(1)}" y="54" text-anchor="middle" font-size="12" fill="#dc2626">P = ${(ld.P_N / 1000).toFixed(1)} kN ↓</text>`);
    }
  }
  // Gối + phản lực.
  reactions.forEach((r, i) => {
    const x = px(r.x_m);
    parts.push(`<path d="M ${x - 22} ${Y + 8} L ${x + 22} ${Y + 8} L ${x} ${Y + 34} z" fill="#e2e8f0" stroke="#334155" stroke-width="2"/>`);
    parts.push(`<line x1="${x - 28}" y1="${Y + 34}" x2="${x + 28}" y2="${Y + 34}" stroke="#334155" stroke-width="2"/>`);
    parts.push(`<text x="${x.toFixed(1)}" y="${Y + 52}" text-anchor="middle" font-size="13" font-weight="bold" fill="#166534">R${i + 1} = ${(r.R_N / 1000).toFixed(2)} kN ↑</text>`);
    parts.push(`<text x="${x.toFixed(1)}" y="${Y + 68}" text-anchor="middle" font-size="12" fill="#64748b">x${i + 1} = ${n2(r.x_m)} m</text>`);
  });
  // Thước kích thước: a1 / nhịp / a2.
  const DY = 218;
  const dim = (a, b, label) => {
    parts.push(`<line x1="${px(a).toFixed(1)}" y1="${DY - 6}" x2="${px(b).toFixed(1)}" y2="${DY - 6}" stroke="#334155" stroke-width="1.5"/>`);
    parts.push(`<line x1="${px(a).toFixed(1)}" y1="${DY - 10}" x2="${px(a).toFixed(1)}" y2="${DY + 4}" stroke="#334155" stroke-width="1"/>`);
    parts.push(`<line x1="${px(b).toFixed(1)}" y1="${DY - 10}" x2="${px(b).toFixed(1)}" y2="${DY + 4}" stroke="#334155" stroke-width="1"/>`);
    parts.push(`<text x="${((px(a) + px(b)) / 2).toFixed(1)}" y="${DY + 18}" text-anchor="middle" font-size="12" fill="#334155">${label}</text>`);
  };
  dim(0, x1_m, `a1 = ${n2(x1_m)} m`);
  dim(x1_m, x2_m, `nhịp ${n2(x2_m - x1_m)} m`);
  dim(x2_m, L_m, `a2 = ${n2(L_m - x2_m)} m`);
  parts.push('</svg>');
  return parts.join('\n');
}
