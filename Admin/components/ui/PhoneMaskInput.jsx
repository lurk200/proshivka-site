import React, { useRef } from 'react';

/**
 * Normalises any phone string to 10 digits (without country code).
 * Accepts: +79001234567, 89001234567, 9001234567
 */
function extractDigits(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) return digits.slice(1);
  if (digits.startsWith('7') && digits.length === 11) return digits.slice(1);
  if (digits.length === 10) return digits;
  // best effort — return up to 10 digits
  return digits.slice(0, 10);
}

/** Formats 10 raw digits → +7 (XXX) XXX-XX-XX */
function applyMask(digits) {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  let out = '+7 ';
  if (d.length > 0) out += '(' + d.slice(0, 3);
  if (d.length >= 3) out += ') ' + d.slice(3, 6);
  if (d.length >= 6) out += '-' + d.slice(6, 8);
  if (d.length >= 8) out += '-' + d.slice(8, 10);
  return out;
}

export function isPhoneValid(masked) {
  const digits = masked.replace(/\D/g, '');
  return digits.length === 11; // 7 + 10 digits
}

/**
 * Controlled phone input with +7 (___) ___-__-__ mask.
 * `value` and `onChange(maskedString)` are controlled by parent.
 */
export default function PhoneMaskInput({ value = '', onChange, className = '', placeholder = '+7 (999) 999-99-99', disabled }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const raw = e.target.value;
    // If cleared
    if (!raw || raw === '+7 ') { onChange(''); return; }
    const digits = extractDigits(raw.replace(/^\+7\s?/, '').replace(/\D/g, ''));
    onChange(applyMask(digits));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = extractDigits(pasted);
    onChange(applyMask(digits));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      const cur = value;
      if (!cur) return;
      // Strip trailing non-digit characters then one digit
      const digits = cur.replace(/\D/g, '').slice(1); // remove country code 7
      const shorter = digits.slice(0, -1);
      onChange(shorter ? applyMask(shorter) : '');
      e.preventDefault();
    }
  };

  const handleFocus = (e) => {
    if (!value) onChange('+7 ');
    setTimeout(() => {
      const el = e.target;
      el.setSelectionRange(el.value.length, el.value.length);
    }, 0);
  };

  const handleBlur = () => {
    if (value === '+7 ' || value === '+7') onChange('');
  };

  return (
    <input
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      autoComplete="tel"
    />
  );
}
