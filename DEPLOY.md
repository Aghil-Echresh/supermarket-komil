Deployment and operations notes

This file contains instructions to deploy and run supermarket-komil on a Linux server or with Docker.

1) systemd (run as a service)
- Copy the unit file and enable the service (update the User and paths if needed):

  sudo cp deploy/supermarket.service /etc/systemd/system/supermarket.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now supermarket.service
  sudo journalctl -u supermarket.service -f

- Edit /etc/systemd/system/supermarket.service and replace `youruser` and paths with the real user and project path.

2) Docker
- Build and run with docker-compose:

  docker compose up -d --build

- Data persistence: db.sqlite is mounted to ./db.sqlite on the host (docker-compose.yml). Make sure the host folder is writable.

3) GitHub Actions (CI)
- The workflow .github/workflows/ci.yml runs on push to main and executes `npm ci` and `npm test` (if any). No deploy step is configured by default.

4) Nginx reverse proxy + HTTPS
- Example nginx config at nginx/supermarket.conf. Replace `server_name _;` with your domain (e.g. example.com).
- After enabling the site and reloading nginx, obtain a certificate with certbot:

  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d example.com

Notes & recommendations
- For production use consider switching from SQLite to PostgreSQL for reliability with concurrent access.
- Ensure the service user has write permissions to the project directory so db.sqlite can be created.
- Add backups for db.sqlite or migrate to a managed DB if needed.
# نکات راه‌اندازی نسخهٔ امن

- ابتدا هر توکن بله‌ای را که قبلاً در مخزن قرار گرفته، در بله لغو کنید. توکن جدید `BALE_BOT_TOKEN` و کلیدهای وب‌هوک را فقط در تنظیمات محیطی میزبان قرار دهید. هیچ‌کدام نباید در Git ثبت شوند.
- برای فعال‌کردن API کارهای داخلی، `TODO_ADMIN_TOKEN` را به‌صورت یک مقدار تصادفی بلند تنظیم کنید. درخواست‌ها به `GET/POST /api/todos` و `PUT/DELETE /api/todos/:id` با هدر `Authorization: Bearer …` مجازند؛ بدون تنظیم توکن این مسیرها غیرفعال می‌مانند.
- `DB_PATH` در صورت نیاز مسیر SQLite را تعیین می‌کند. اگر قبلاً داده دارید، از فایل پشتیبان بگیرید و مسیر قبلی را حفظ کنید؛ آن را با یک فایل خالی جایگزین نکنید.
- الگوی Render با دیسک `/var/data` به پلن پولی نیاز دارد. قبل از همگام‌سازی Blueprint یا تغییر پلن، هزینه و انتقال دادهٔ موجود را تأیید کنید. دیسک دائمی در پلن رایگان در دسترس نیست؛ [راهنمای دیسک‌های Render](https://render.com/docs/disks).
- صفحهٔ عمومی فروشگاه از GitHub Pages مستقل از API ارائه می‌شود. فرم آزمایشی ورود از سرور بک‌اند عرضه نمی‌شود.
