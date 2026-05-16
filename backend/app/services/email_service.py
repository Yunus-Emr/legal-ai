"""
Email Service — Şifre sıfırlama ve bildirim emaillerı
SMTP tabanlı, aiosmtplib ile async gönderim.
"""
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class EmailService:
    def _build_message(self, to: str, subject: str, html: str) -> MIMEMultipart:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))
        return msg

    def _send_sync(self, to: str, subject: str, html: str) -> None:
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning(f"[Email] SMTP yapılandırılmamış — email gönderilmedi: {subject} → {to}")
            return
        try:
            msg = self._build_message(to, subject, html)
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_FROM, to, msg.as_string())
            logger.info(f"[Email] Gönderildi: {subject} → {to}")
        except Exception as e:
            logger.error(f"[Email] Gönderim hatası: {e}")

    async def send(self, to: str, subject: str, html: str) -> None:
        """Thread pool'da sync SMTP gönderimi yapar (event loop bloke etmez)."""
        await asyncio.to_thread(self._send_sync, to, subject, html)

    async def send_password_reset(self, to: str, reset_url: str) -> None:
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e40af">Legal AI — Şifre Sıfırlama</h2>
          <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
          <p>Bu link <strong>15 dakika</strong> geçerlidir.</p>
          <a href="{reset_url}" style="display:inline-block;padding:12px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
            Şifremi Sıfırla
          </a>
          <p style="color:#6b7280;font-size:12px">
            Bu isteği siz yapmadıysanız bu emaili görmezden gelin.
          </p>
        </div>
        """
        await self.send(to, "Legal AI — Şifre Sıfırlama", html)


email_service = EmailService()
