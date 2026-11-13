import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-11-01",
  devtools: { enabled: false },
  telemetry: false,
  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  build: { transpile: ["@contrast-check/core"] },
  app: {
    head: {
      title: "Contrast Check",
      htmlAttrs: { lang: "en" },
      bodyAttrs: { class: "font-sans antialiased" },
      meta: [
        {
          name: "description",
          content:
            "Check text and background color contrast against WCAG 2.2 and get an accessible text color suggestion.",
        },
      ],
    },
  },
});
