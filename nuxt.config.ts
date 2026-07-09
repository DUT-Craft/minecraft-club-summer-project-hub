import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2025-07-15",
  nitro: {
    prerender: {
      autoSubfolderIndex: false
    }
  },
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  modules: [
    "@bg-dev/nuxt-naiveui",
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    ["pinia-plugin-persistedstate/nuxt", {
      storage: "localStorage",
    }],
    "dayjs-nuxt",
  ],
  vite: {
    optimizeDeps: {
      include: [
        "highlight.js/lib/core",
        "highlight.js/lib/languages/json",
        "highlight.js/lib/languages/ini",
        "highlight.js/lib/languages/yaml",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "dayjs",
        "dayjs/plugin/updateLocale",
        "dayjs/locale/zh-cn",
        "dayjs/plugin/timezone",
        "dayjs/plugin/localizedFormat",
        "dayjs/plugin/relativeTime",
        "dayjs/plugin/utc",
      ],
    },
    plugins: [
      AutoImport({
        imports: [
          {
            "naive-ui": [
              "useDialog",
              "useMessage",
              "useNotification",
              "useLoadingBar",
            ],
          },
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
  },
  dayjs: {
    locales: ["zh-cn"],
    defaultLocale: "zh-cn",
    plugins: ["timezone", "localizedFormat"],
    defaultTimezone: "Asia/Shanghai",
  },
  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },
});
