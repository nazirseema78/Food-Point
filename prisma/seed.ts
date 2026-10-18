// Seeds the admin user, shop settings, a sample menu and a welcome coupon.
// Safe to re-run: existing rows are left alone (matched by email / slug / code).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const rs = (rupees: number) => Math.round(rupees * 100);

const HOURS = Object.fromEntries(
  ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, { open: "11:00", close: "23:00", closed: false }]),
);

type SeedProduct = {
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  featured?: boolean;
  variants?: [string, number][];
  addons?: { name: string; min: number; max: number; options: [string, number][] }[];
};

const MENU: { name: string; description: string; products: SeedProduct[] }[] = [
  {
    name: "Burgers",
    description: "Juicy, stacked and made fresh to order.",
    products: [
      {
        name: "Classic Veg Burger",
        description: "Crispy veg patty, lettuce, tomato, onion and house mayo.",
        price: 99,
        isVeg: true,
        featured: true,
        addons: [{ name: "Extras", min: 0, max: 3, options: [["Extra cheese slice", 20], ["Jalapeños", 15], ["Extra patty", 45]] }],
      },
      {
        name: "Paneer Tikka Burger",
        description: "Tandoori paneer, mint mayo and pickled onions.",
        price: 149,
        isVeg: true,
        addons: [{ name: "Extras", min: 0, max: 2, options: [["Extra cheese slice", 20], ["Make it spicy", 0]] }],
      },
      {
        name: "Crispy Chicken Burger",
        description: "Southern-fried chicken thigh, slaw and smoky sauce.",
        price: 169,
        isVeg: false,
        featured: true,
        addons: [
          { name: "Extras", min: 0, max: 3, options: [["Extra cheese slice", 20], ["Fried egg", 25], ["Extra patty", 60]] },
          { name: "Make it a meal", min: 0, max: 1, options: [["Fries + Coke", 89]] },
        ],
      },
    ],
  },
  {
    name: "Pizzas",
    description: "Hand-stretched dough, baked hot.",
    products: [
      {
        name: "Margherita",
        description: "Tomato sauce, mozzarella and fresh basil.",
        price: 199,
        isVeg: true,
        featured: true,
        variants: [["Regular (7\")", 199], ["Medium (10\")", 349], ["Large (13\")", 499]],
        addons: [{ name: "Extra toppings", min: 0, max: 4, options: [["Extra cheese", 50], ["Olives", 40], ["Jalapeños", 40], ["Mushrooms", 40]] }],
      },
      {
        name: "Farmhouse",
        description: "Onion, capsicum, tomato, mushroom and sweet corn.",
        price: 249,
        isVeg: true,
        variants: [["Regular (7\")", 249], ["Medium (10\")", 429], ["Large (13\")", 599]],
        addons: [{ name: "Crust", min: 1, max: 1, options: [["Classic hand-tossed", 0], ["Thin crust", 0], ["Cheese burst", 99]] }],
      },
      {
        name: "Chicken Tikka Pizza",
        description: "Tandoori chicken tikka, onion and capsicum.",
        price: 299,
        isVeg: false,
        featured: true,
        variants: [["Regular (7\")", 299], ["Medium (10\")", 499], ["Large (13\")", 699]],
      },
    ],
  },
  {
    name: "Sides",
    description: "Perfect partners.",
    products: [
      { name: "Salted Fries", description: "Golden, crispy, lightly salted.", price: 79, isVeg: true, variants: [["Regular", 79], ["Large", 109]] },
      { name: "Peri Peri Fries", description: "Fries tossed in spicy peri peri.", price: 99, isVeg: true, featured: true },
      { name: "Garlic Bread", description: "Toasted with garlic butter and herbs.", price: 119, isVeg: true },
      { name: "Chicken Nuggets (6 pc)", description: "Crispy nuggets with a dip.", price: 139, isVeg: false },
    ],
  },
  {
    name: "Beverages",
    description: "Something to wash it down.",
    products: [
      { name: "Coke", description: "Chilled, 300 ml.", price: 49, isVeg: true },
      { name: "Cold Coffee", description: "Thick and creamy.", price: 99, isVeg: true },
      { name: "Fresh Lime Soda", description: "Sweet, salted or mixed.", price: 69, isVeg: true, addons: [{ name: "Style", min: 1, max: 1, options: [["Sweet", 0], ["Salted", 0], ["Mixed", 0]] }] },
    ],
  },
  {
    name: "Desserts",
    description: "End on a sweet note.",
    products: [
      { name: "Choco Lava Cake", description: "Warm chocolate cake with a molten centre.", price: 99, isVeg: true, featured: true },
      { name: "Brownie with Ice Cream", description: "Fudgy brownie and a scoop of vanilla.", price: 149, isVeg: true },
    ],
  },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Returns a problem description, or null when the admin env vars are usable. */
function adminEnvProblem(email: string, password: string): string | null {
  if (!email || email.includes("<")) return "ADMIN_EMAIL is not set";
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) return `ADMIN_EMAIL "${email}" is not a valid email`;
  if (!password || password.includes("<")) return "ADMIN_PASSWORD is not set";
  if (password.length < 8) return "ADMIN_PASSWORD must be at least 8 characters";
  return null;
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const problem = adminEnvProblem(email, password);
  if (problem) {
    console.warn(`! Admin not created: ${problem}. Fix .env.local and run \`npm run db:seed\` again.`);
    return;
  }
  const name = process.env.ADMIN_NAME && !process.env.ADMIN_NAME.includes("<") ? process.env.ADMIN_NAME : "Admin";

  const existingAdmin = await db.user.findUnique({ where: { email } });
  if (existingAdmin) {
    if (existingAdmin.role !== "ADMIN") await db.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`✓ Admin exists: ${email}`);
  } else {
    await db.user.create({
      data: { name, email, role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`✓ Admin created: ${email}`);
  }
}

async function main() {
  await seedAdmin();

  // Shop settings
  const branchCount = await db.branch.count();
  if (branchCount === 0) {
    await db.branch.create({
      data: {
        name: "Food-Point",
        slug: "main",
        phone: "9876543210",
        addressLine: "Shop 1, Main Market Road",
        city: "Your City",
        openingHours: HOURS,
        deliveryFee: rs(30),
        freeDeliveryAbove: rs(399),
        minOrder: rs(99),
        taxRateBps: 0,
      },
    });
    console.log("✓ Shop settings created (edit them in Admin → Settings)");
  } else {
    console.log("✓ Shop settings exist");
  }

  // Menu
  let created = 0;
  for (const [ci, cat] of MENU.entries()) {
    const category = await db.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description, sortOrder: ci * 10 },
    });

    for (const [pi, p] of cat.products.entries()) {
      const slug = slugify(p.name);
      if (await db.product.findUnique({ where: { slug } })) continue;
      const variantPrices = p.variants?.map(([, price]) => rs(price)) ?? [];
      await db.product.create({
        data: {
          categoryId: category.id,
          name: p.name,
          slug,
          description: p.description,
          basePrice: variantPrices.length ? Math.min(...variantPrices) : rs(p.price),
          isVeg: p.isVeg,
          isFeatured: p.featured ?? false,
          sortOrder: pi * 10,
          variants: {
            create: (p.variants ?? []).map(([vName, price], i) => ({ name: vName, price: rs(price), sortOrder: i })),
          },
          addonGroups: {
            create: (p.addons ?? []).map((g, gi) => ({
              name: g.name,
              minSelect: g.min,
              maxSelect: g.max,
              sortOrder: gi,
              addons: { create: g.options.map(([aName, price], ai) => ({ name: aName, price: rs(price), sortOrder: ai })) },
            })),
          },
        },
      });
      created++;
    }
  }
  console.log(`✓ Menu: ${created} sample product(s) added`);

  // Coupon
  await db.coupon.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: {
      code: "WELCOME50",
      description: "₹50 off on orders above ₹299",
      type: "FLAT",
      value: rs(50),
      minOrder: rs(299),
    },
  });
  console.log("✓ Coupon WELCOME50 ready");
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
