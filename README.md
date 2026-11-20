# سوپرمارکت کمیل

وب‌سایت و Backend سوپرمارکت کمیل به همراه ربات بله.

## ربات بله

Backend از API رسمی بله با Base URL زیر استفاده می‌کند:

https://tapi.bale.ai/bot<TOKEN>/

### متغیرهای محیطی

- `BALE_BOT_TOKEN`: توکن بازوی بله
- `BALE_WEBHOOK_SECRET`: رشته تصادفی برای مسیر Webhook
- `BALE_ADMIN_SECRET`: رشته تصادفی برای endpointهای مدیریتی
- `BALE_PUBLIC_URL`: نشانی عمومی HTTPS در صورت نبود `RENDER_EXTERNAL_URL`
- `TODO_ADMIN_TOKEN`: توکن Bearer برای API داخلی کارها

**هیچ‌کدام از این مقادیر نباید داخل Git commit شوند.**

### Webhook

نشانی پایهٔ سرویس را در تنظیمات میزبان به‌عنوان `BALE_PUBLIC_URL` قرار بده؛ در Render نشانی داخلیِ آماده نیز پشتیبانی می‌شود.

سپس یک درخواست POST به:

`/api/bale/set-webhook`

با Header زیر:

`x-admin-secret: <BALE_ADMIN_SECRET>`

درخواست به Body نیاز ندارد؛ برای امنیت، نشانی از تنظیمات خود سرویس خوانده می‌شود، نه از درخواست کاربر.

سرویس خودش Webhook نهایی را به شکل زیر می‌سازد:

`https://YOUR-SERVICE-DOMAIN/bale/webhook/<BALE_WEBHOOK_SECRET>`

### تست

`GET /health`

باید پاسخ JSON با `ok: true` برگرداند. برای نصب و اجرای تست محلی با Node.js 20.17 یا جدیدتر: `npm ci` و سپس `npm test`.

مستندات رسمی بله:
https://docs.bale.ai/
