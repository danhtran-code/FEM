// Hồi quy: tên trường trong app.js phải khớp schema pile_specs.json.
// (Lỗi từng gặp: app.js dùng pc.fpu_MPa trong khi JSON ghi f_pu_MPa → hiện "undefined".)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSrc = readFileSync(new URL('../src/ui/app.js', import.meta.url), 'utf-8');
const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));

test('app.js dung dung ten truong pc_bar trong JSON', () => {
  const pcBar = specs.piles[0].pc_bar;
  for (const key of Object.keys(pcBar)) {
    assert.ok(appSrc.includes(`pc.${key}`) || !appSrc.includes(`pc.${key.replace('_', '')}`),
      `app.js khong tham chieu pc.${key}`);
  }
  assert.ok(appSrc.includes('pc.f_pu_MPa'), 'app.js phai doc pc.f_pu_MPa');
  assert.ok(!appSrc.includes('fpu_MPa'), 'khong duoc dung ten cu fpu_MPa');
  for (const pile of specs.piles) {
    assert.equal(typeof pile.pc_bar.f_pu_MPa, 'number', `${pile.code} thieu f_pu_MPa`);
  }
});
