export const site = {
  name: "DAMI",
  origin: "Aix-en-Provence",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "DAMI is an independent fashion label exploring the intersection of contemporary streetwear, refined design and everyday luxury.",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};

export const nav = {
  left: [
    { href: "/shop", label: "Shop" },
    { href: "/collections", label: "Collections" },
  ],
  right: [{ href: "/about", label: "About" }],
};
