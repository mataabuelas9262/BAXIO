import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { resolve, join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class OtpSmsService {
  get preview() { return process.env.SMS_MODE === 'preview' && process.env.NODE_ENV !== 'production'; }
  get available() { return this.preview || (process.env.SMS_MODE === 'twilio' && /^AC[a-f0-9]{32}$/i.test(process.env.TWILIO_ACCOUNT_SID || '') && !!process.env.TWILIO_AUTH_TOKEN && /^\+[1-9]\d{7,14}$/.test(process.env.TWILIO_FROM || '')); }
  async sendCode(phone: string, code: string) {
    if (!this.available) throw new ServiceUnavailableException('Los SMS todavía no están disponibles. Usa el correo electrónico.');
    if (this.preview) {
      const dir = resolve(process.env.SMS_PREVIEW_DIR || '.sms-preview');
      await mkdir(dir, { recursive: true, mode: 0o700 });
      await writeFile(join(dir, `${randomUUID()}.txt`), `PRUEBA LOCAL; no se envió SMS\nPara: ${phone}\nTu código de BAXIO es ${code}. Vence en 10 minutos.`, { mode: 0o600 });
      return;
    }
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST', signal: AbortSignal.timeout(15_000),
        headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM!, Body: `BAXIO: tu codigo es ${code}. Vence en 10 minutos. No lo compartas.` }),
      });
      if (!response.ok) throw new Error('SMS delivery failed');
    } catch { throw new ServiceUnavailableException('No se pudo enviar el SMS. Inténtalo más tarde.'); }
  }
}
