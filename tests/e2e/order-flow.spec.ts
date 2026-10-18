import { expect, test } from "@playwright/test";

// Happy path against the seeded sample menu: guest orders a burger for takeaway.
test("guest can order and track", async ({ page }) => {
  await page.goto("/menu");
  await expect(page.getByRole("heading", { name: "Menu" })).toBeVisible();

  await page.getByRole("button", { name: "Add Peri Peri Fries" }).click();
  await page.getByRole("button", { name: "Add Peri Peri Fries" }).click();
  await page.goto("/checkout");

  const takeaway = page.getByRole("radio", { name: "Takeaway" });
  if (await takeaway.isVisible()) await takeaway.click();

  await page.getByLabel("Name").fill("Test Customer");
  await page.getByLabel("Mobile number").fill("9876543210");

  const place = page.getByRole("button", { name: /Place order/ });
  await expect(place).toBeEnabled({ timeout: 15_000 });
  await place.click();

  await expect(page).toHaveURL(/\/orders\/FP/, { timeout: 15_000 });
  await expect(page.getByText("Order placed! Thank you.")).toBeVisible();
});

test("admin area requires login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
