# سوپرمارکت کمیل

وب‌سایت و Backend سوپرمارکت کمیل به همراه ربات بله.

## ربات بله

Backend از API رسمی بله با Base URL زیر استفاده می‌کند:

https://tapi.bale.ai/bot<TOKEN>/

### متغیرهای محیطی

- `BALE_BOT_TOKEN`: توکن بازوی بله
- `BALE_WEBHOOK_SECRET`: رشته تصادفی برای مسیر Webhook
- `BALE_ADMIN_SECRET`: رشته تصادفی برای endpointهای مدیریتی

**هیچ‌کدام از این مقادیر نباید داخل Git commit شوند.**

### Webhook

بعد از Deploy شدن سرویس، URL پایه سرویس را داشته باش.

سپس یک درخواست POST به:

`/api/bale/set-webhook`

با Header زیر:

`x-admin-secret: <BALE_ADMIN_SECRET>`

و Body:

`{"base_url":"https://YOUR-SERVICE-DOMAIN" }`

ارسال کن.

سرویس خودش Webhook نهایی را به شکل زیر می‌سازد:

`https://YOUR-SERVICE-DOMAIN/bale/webhook/<BALE_WEBHOOK_SECRET>`

### تست

`GET /health`

باید پاسخ JSON با `ok: true` برگرداند.

مستندات رسمی بله:
https://docs.bale.ai/
