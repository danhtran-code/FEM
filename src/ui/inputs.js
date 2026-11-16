// Nhập liệu giao diện xep-coc — hàm thuần (không DOM), test được bằng node.
// Mọi giá trị nhập theo đơn vị hiển thị (m, kN, MPa, kN/m³); hàm này đổi
// sang SI cho lõi tính và trả về danh sách lỗi thay vì ném ngoại lệ lẻ.

/**
 * Đọc và kiểm tra đầu vào BT01/BT02 từ form.
 * @param {object} raw { pileCode, L_m, x1_m, x2_m, E_MPa, gamma_kN_m3, loadRows }
 *   loadRows: [{ kind: 'point'|'patch', P_kN, x_m, length_m? }] (P_kN > 0).
 * @returns {{ ok: boolean, errors: string[], opts: object|null }}
 *   opts: { L_m, x1_m, x2_m, E_Pa, gamma_kN_m3, loads: [{P_N, x_m, length_m}] }
 *   (loads rỗng = BT01 thuần; có tải = BT02).
 */
export function parseInputs(raw) {
  const errors = [];
  const num = (v, name) => {
    const n = typeof v === 'string' ? Number(v) : v;
    if (v === '' || v === null || v === undefined || Number.isNaN(n)) {
      errors.push(`${name}: chưa nhập số`);
      return null;
    }
    return n;
  };

  const L_m = num(raw.L_m, 'Chiều dài cọc L');
  const x1_m = num(raw.x1_m, 'Vị trí gối 1 (x1)');
  const x2_m = num(raw.x2_m, 'Vị trí gối 2 (x2)');
  const E_MPa = num(raw.E_MPa, 'Môđun E_b');
  const gamma = num(raw.gamma_kN_m3, 'Trọng lượng thể tích γ_c');

  if (!raw.pileCode) errors.push('Chưa chọn mã cọc');
  if (L_m !== null && !(L_m > 0)) errors.push('Chiều dài cọc L phải > 0');
  if (E_MPa !== null && !(E_MPa > 0)) errors.push('Môđun E_b phải > 0');
  if (gamma !== null && !(gamma > 0)) errors.push('γ_c phải > 0');
  if (L_m !== null && x1_m !== null && x2_m !== null) {
    if (!(x1_m >= 0 && x2_m <= L_m && x1_m < x2_m)) {
      errors.push(`Gối không hợp lệ: cần 0 ≤ x1 < x2 ≤ L (nhận x1=${x1_m}, x2=${x2_m}, L=${L_m})`);
    }
  }

  const loads = [];
  (raw.loadRows || []).forEach((row, i) => {
    const tag = `Tải ${i + 1}`;
    const P_kN = num(row.P_kN, `${tag} — lực P`);
    const x_m = num(row.x_m, `${tag} — vị trí x`);
    if (P_kN !== null && !(P_kN > 0)) errors.push(`${tag}: lực P phải > 0`);
    if (x_m !== null && L_m !== null && !(x_m >= 0 && x_m <= L_m)) {
      errors.push(`${tag}: vị trí x=${x_m} ngoài [0, ${L_m}]`);
    }
    if (row.kind === 'patch') {
      const len = num(row.length_m, `${tag} — chiều dài vệt`);
      if (len !== null && !(len > 0)) errors.push(`${tag}: chiều dài vệt phải > 0`);
      if (len !== null && x_m !== null && L_m !== null) {
        if (!(x_m - len / 2 >= 0 && x_m + len / 2 <= L_m)) {
          errors.push(`${tag}: vệt [${x_m - len / 2}, ${x_m + len / 2}] vượt ngoài [0, ${L_m}]`);
        }
      }
      if (P_kN !== null && x_m !== null && len !== null) {
        loads.push({ P_N: P_kN * 1000, x_m, length_m: len });
      }
    } else if (P_kN !== null && x_m !== null) {
      loads.push({ P_N: P_kN * 1000, x_m, length_m: 0 });
    }
  });

  if (errors.length > 0) return { ok: false, errors, opts: null };
  return {
    ok: true,
    errors: [],
    opts: {
      L_m,
      x1_m,
      x2_m,
      E_Pa: E_MPa * 1e6,
      gamma_kN_m3: gamma,
      loads,
    },
  };
}

/** Định dạng số hiển thị: fmt(17388.5, 2) -> "17 388,50" (vi-VN). */
export function fmt(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
