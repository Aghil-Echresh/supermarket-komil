import { annotations, server, tool, z } from "@noodleseed/one";

const products = [
  { id: "lavashak-100", name: "لواشک", category: "تنقلات", price: 100, unit: "عدد", inStock: true },
  { id: "chips-70", name: "چیپس", category: "تنقلات", price: 70, unit: "بسته", inStock: true },
  { id: "mast-mosir-110", name: "ماست موسیر", category: "لبنیات", price: 110, unit: "عدد", inStock: true },
  { id: "pofak-90", name: "پفک", category: "تنقلات", price: 90, unit: "بسته", inStock: true }
] as const;

const store = {
  name: "سوپرمارکت کمیل",
  manager: "عقیل عچرش",
  phone: "۰۹۰۳۰۶۳۵۶۴۸",
  address: "کوی ابوذر، خیابان نشان، بین فرعی ۳ و ۴",
  website: "https://myqrsmart.me/haypermarket-2/",
  location: "zaya.io/rrql6"
};

const guide = {
  description:
    "دستیار MCP سوپرمارکت کمیل برای معرفی فروشگاه، جست‌وجوی کالا و آماده‌سازی سفارش.",
  useWhen: [
    "کاربر درباره اطلاعات سوپرمارکت کمیل سؤال می‌کند.",
    "کاربر می‌خواهد کالاها، قیمت یا موجودی را جست‌وجو کند."
  ],
  workflows: [
    {
      id: "find_products",
      title: "جست‌وجوی کالا",
      steps: [
        { capability: { kind: "tool", name: "search_products" } }
      ]
    },
    {
      id: "store_info",
      title: "اطلاعات فروشگاه",
      steps: [
        { capability: { kind: "tool", name: "get_store_info" } }
      ]
    }
  ],
  boundaries: [
    "فقط اطلاعات و کالاهای تعریف‌شده در این MCP را گزارش کن.",
    "قیمت یا موجودی تعریف‌نشده را حدس نزن."
  ]
};

export default server(
  "supermarket_komil",
  {
    title: "سوپرمارکت کمیل",
    version: "0.1.0",
    agentGuide: guide
  },
  [
    tool("get_store_info", {
      title: "اطلاعات فروشگاه",
      description: "اطلاعات عمومی و راه‌های تماس سوپرمارکت کمیل را برمی‌گرداند.",
      input: z.object({}),
      output: z.object({
        name: z.string(),
        manager: z.string(),
        phone: z.string(),
        address: z.string(),
        website: z.string(),
        location: z.string()
      }),
      annotations: annotations.readOnly(),
      fulfil: () => store
    }),

    tool("search_products", {
      title: "جست‌وجوی کالا",
      description: "در کاتالوگ فعلی سوپرمارکت کمیل کالاها را بر اساس نام یا دسته‌بندی جست‌وجو می‌کند.",
      input: z.object({
        query: z.string().min(1).describe("نام کالا یا دسته‌بندی"),
        limit: z.number().int().min(1).max(20).default(10)
      }),
      output: z.object({
        products: z.array(z.object({
          id: z.string(),
          name: z.string(),
          category: z.string(),
          price: z.number(),
          unit: z.string(),
          inStock: z.boolean()
        })).max(20)
      }),
      annotations: annotations.readOnly(),
      fulfil: ({ input }) => {
        const q = `${input.query}`.trim().toLocaleLowerCase("fa-IR");
        const matches = products
          .filter(p =>
            p.name.toLocaleLowerCase("fa-IR").includes(q) ||
            p.category.toLocaleLowerCase("fa-IR").includes(q)
          )
          .slice(0, input.limit);
        return { products: matches };
      }
    }),

    tool("get_product", {
      title: "جزئیات کالا",
      description: "قیمت، واحد و موجودی یک کالا را بر اساس شناسه آن برمی‌گرداند.",
      input: z.object({ productId: z.string() }),
      output: z.object({
        found: z.boolean(),
        product: z.object({
          id: z.string(),
          name: z.string(),
          category: z.string(),
          price: z.number(),
          unit: z.string(),
          inStock: z.boolean()
        }).nullable()
      }),
      annotations: annotations.readOnly(),
      fulfil: ({ input }) => {
        const product = products.find(p => p.id === input.productId) ?? null;
        return { found: product !== null, product };
      }
    })
  ]
);
