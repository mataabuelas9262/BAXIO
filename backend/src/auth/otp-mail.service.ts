import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { mkdir, writeFile, readdir, stat, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class OtpMailService {
  get preview() { return process.env.MAIL_MODE === 'preview' && process.env.NODE_ENV !== 'production'; }
  ensureReady() {
    if (this.preview) return;
    if (process.env.MAIL_MODE !== 'smtp' || !process.env.SMTP_HOST || !process.env.SMTP_FROM) {
      throw new ServiceUnavailableException('La verificación por correo aún no está disponible. Inténtalo más tarde.');
    }
  }
  async sendCode(email: string, code: string, purpose: 'verification' | 'password' = 'verification') {
    this.ensureReady();
    const subject = purpose === 'password' ? 'Recupera tu contraseña de BAXIO' : 'Tu código de verificación BAXIO';
    const intro = purpose === 'password' ? 'Solicitaste restablecer tu contraseña. Este código no desactiva tu 2FA.\n' : '';
    const text = intro + `Tu código de BAXIO es ${code}.\nVence en 10 minutos y solo puede usarse una vez.\nSi no solicitaste este código, ignora este correo.`;
    if (this.preview) {
      const dir = resolve(process.env.MAIL_PREVIEW_DIR || '.mail-preview');
      await mkdir(dir, { recursive: true, mode: 0o700 });
      // Short-lived local testing artifacts, never served by the API or uploads.
      for (const filename of await readdir(dir)) {
        if (!filename.endsWith('.eml')) continue;
        const file = join(dir, filename);
        const info = await stat(file).catch(() => null);
        if (info && info.mtimeMs < Date.now() - 600_000) await unlink(file).catch(() => undefined);
      }
      await writeFile(join(dir, `${Date.now()}-${randomUUID()}.eml`), `To: ${email}\nSubject: ${subject} (PRUEBA LOCAL)\n\n${text}`, { mode: 0o600 });
      return;
    }
    const transport = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      requireTLS: process.env.SMTP_PORT !== '465',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10_000, socketTimeout: 15_000,
    });
    try { await transport.sendMail({ from: process.env.SMTP_FROM, to: email, subject, text }); }
    catch { throw new ServiceUnavailableException('No se pudo enviar el código. Inténtalo de nuevo en un momento.'); }
    finally { transport.close(); }
  }
}
