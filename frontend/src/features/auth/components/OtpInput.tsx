'use client';
import React, { useState } from 'react';
import styles from './OtpInput.module.css';

export function OtpInput({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <div className={styles.root}>
    <label className="sr-only" htmlFor="otp-code">Código de verificación de 6 dígitos</label>
    <div className={styles.slots} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => <span key={i} className={`${styles.slot} ${focused && i === Math.min(value.length, 5) ? styles.active : ''}`}>{value[i] || ''}</span>)}
    </div>
    <input id="otp-code" className={styles.input} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={value} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} onPaste={e => { const code = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (code) { e.preventDefault(); onChange(code); } }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} disabled={disabled} autoFocus />
  </div>;
}
