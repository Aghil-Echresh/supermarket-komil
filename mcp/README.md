# MCP سوپرمارکت کمیل

این پوشه، لایه MCP پروژه «سوپرمارکت کمیل» است و با Noodle Seed نوشته شده است.

## ابزارهای فعلی

- `get_store_info` — اطلاعات فروشگاه
- `search_products` — جست‌وجوی کالا در کاتالوگ نمونه
- `get_product` — جزئیات یک کالا

کاتالوگ فعلی داخل `src/server.ts` نمونه است. برای اتصال به موجودی و سفارش واقعی فروشگاه، مرحله بعد باید API واقعی backend پروژه به connectorهای Noodle Seed متصل شود.

## اجرای Noodle Seed

پیش‌نیاز: Node.js 24+.

در این پوشه، پس از آماده‌سازی پروژه Noodle Seed:

```bash
npm install
npm run validate
npm run test
npm run dev
```

فعلاً هیچ اطلاعات بانکی، رمز، توکن یا کلید API داخل کد قرار داده نشده است.
