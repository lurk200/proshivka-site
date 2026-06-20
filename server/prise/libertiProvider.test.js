/**
 * Unit tests for mapPartType — the classifier that assigns partType to liberti products.
 *
 * Tests document real bugs found on Samsung Galaxy S25 Ultra data (confirmed 2026-06-20):
 *  - Liberti's "Тип:" field is often wrong → title-first classification required
 *  - Screen protectors / OCA film appeared as "display" (confusing 139₽ film with 9890₽ module)
 *
 * Run:  node --test server/prise/libertiProvider.test.js
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { mapPartType } from './libertiProvider.js';

// ── Title-first: correct type from title even when Тип: is wrong ─────────────

test('LCD дисплей → display even when Тип: says "Задняя крышка"', () => {
  const title = 'LCD дисплей для Samsung Galaxy S25 Ultra SM-S938B в рамке (черный) 100% OR SP';
  const type  = 'Задняя крышка для телефона; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), 'display');
});

test('LCD дисплей → display even when Тип: says "АКБ для телефона"', () => {
  const title = 'LCD дисплей для Samsung Galaxy S25 Ultra SM-S938B в рамке (черный) 100% OR SP';
  const type  = 'АКБ для телефона; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), 'display');
});

test('Задняя крышка → back-glass even when Тип: says "Защитное стекло"', () => {
  const title = 'Задняя крышка для Samsung Galaxy S25 Ultra SM-S938 (черный), премиум';
  const type  = 'Защитное стекло; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), 'back-glass');
});

test('Аккумулятор → battery even when Тип: says "Защитное стекло"', () => {
  const title = 'Аккумулятор (АКБ) Samsung S25 Ultra (S938B EB-BS938ABY) 100% Filling Capacity';
  const type  = 'Защитное стекло; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), 'battery');
});

// ── Screen-protector exclusion ────────────────────────────────────────────────

test('Защитное стекло → null (excluded, not a repair part)', () => {
  const title = 'Защитное стекло "One Minute" для Samsung Galaxy S25 Ultra HD Unlock Fingerprint';
  const type  = 'Стекло и OCA для переклейки; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), null);
});

test('G+OCA PRO стекло для переклейки → null (OCA film, not display module)', () => {
  const title = 'G+OCA PRO стекло для переклейки Samsung Galaxy S25 Ultra (черный)';
  const type  = 'Защитное стекло; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), null);
});

test('Защитное стекло REMAX → null even when Тип: says "Дисплей для телефона"', () => {
  const title = 'Защитное стекло REMAX GL-27 Medicine для Samsung S25 Ultra 3D, 9H';
  const type  = 'Дисплей для телефона; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), null);
});

test('Защитное стекло SUPGLASS → null', () => {
  const title = 'Защитное стекло SUPGLASS SG-11 для Samsung S25 Ultra Transparent Full Cover Glass';
  assert.equal(mapPartType(null, title), null);
});

// ── Correct cases must not regress ───────────────────────────────────────────

test('LCD дисплей с корректным Тип: → display', () => {
  const title = 'LCD дисплей для Samsung Galaxy S25 Ultra SM-S938 в сборе в рамке Soft OLED 120 Гц (черный)';
  const type  = 'Дисплей для телефона; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), 'display');
});

test('Задняя крышка с корректным Тип: → back-glass', () => {
  const title = 'Задняя крышка для Samsung Galaxy S25 Ultra SM-S938 (серебро), премиум';
  const type  = 'Задняя крышка для телефона; Совместимость: Samsung Galaxy S25 Ultra';
  assert.equal(mapPartType(type, title), 'back-glass');
});

test('Аккумулятор с корректным Тип: → battery', () => {
  const title = 'Аккумулятор (АКБ) Samsung S25 Ultra (S938B) 4900mAh';
  const type  = 'АКБ для телефона';
  assert.equal(mapPartType(type, title), 'battery');
});

test('Без title — чистый Тип: Дисплей → display', () => {
  assert.equal(mapPartType('Дисплей для телефона'), 'display');
});

test('Без title — Тип: с "переклейк" (бывший баг display) → null теперь', () => {
  // "Стекло и OCA для переклейки" — это ОСА-плёнка, не замена модуля дисплея.
  assert.equal(mapPartType('Стекло и OCA для переклейки'), null);
});
