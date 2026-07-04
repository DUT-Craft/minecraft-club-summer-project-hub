<template>
  <n-config-provider
    :hljs="hljs"
    :theme="osTheme"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <nuxt-loading-indicator />
    <n-dialog-provider>
      <n-notification-provider>
        <n-layout class="app-layout" has-sider>
          <n-layout-sider
            v-model:collapsed="collapsed"
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="232"
            :native-scrollbar="false"
            class="app-sider"
          >
            <div class="brand" :class="{ 'brand-collapsed': collapsed }">
              <div class="brand-mark">N</div>
              <div v-if="!collapsed" class="brand-copy">
                <strong>DUT Neko</strong>
                <span>猫娘管理系统</span>
              </div>
            </div>

            <n-menu
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="20"
              :options="menuOptions"
              :value="activeMenuKey"
              class="side-menu"
              @update:value="handleMenuSelect"
            />
          </n-layout-sider>

          <n-layout class="main-layout">
            <n-layout-header bordered class="app-header">
              <n-button quaternary circle type="primary" @click="collapsed = !collapsed">
                {{ collapsed ? "展" : "收" }}
              </n-button>
              <div class="header-title">
                <strong>{{ currentTitle }}</strong>
                <span>欢迎回来，开始处理今天的工作。</span>
              </div>
            </n-layout-header>

            <n-layout-content class="app-content">
              <slot />
            </n-layout-content>

            <n-layout-footer bordered class="app-footer">
              DUT Neko 猫娘管理系统喵~
            </n-layout-footer>
          </n-layout>
        </n-layout>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import type { MenuOption } from "naive-ui";
import { dateZhCN, darkTheme, useOsTheme, zhCN } from "naive-ui";

import hljs from "highlight.js/lib/core";
import ini from "highlight.js/lib/languages/ini";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("json", json);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("toml", ini);
hljs.registerLanguage("yaml", yaml);

const route = useRoute();
const naiveOsTheme = useOsTheme();
const collapsed = ref(false);

const osTheme = computed(() => (naiveOsTheme.value === "dark" ? darkTheme : null));

const menuOptions: MenuOption[] = [
  {
    label: "工作台",
    key: "/",
  },
  {
    label: "用户中心",
    key: "/user-center",
  },
  {
    label: "PVE 管理",
    key: "/pve-users",
  },
  {
    label: "VM 管理",
    key: "/virtual-machines",
  }
];

const menuTitleMap = new Map(
  menuOptions
    .filter((item): item is MenuOption & { key: string; label: string } => {
      return typeof item.key === "string" && typeof item.label === "string";
    })
    .map((item) => [item.key, item.label]),
);

const activeMenuKey = computed(() => {
  const path = route.path === "" ? "/" : route.path;

  return menuTitleMap.has(path) ? path : "/";
});

const currentTitle = computed(() => menuTitleMap.get(activeMenuKey.value) ?? "工作台");

const handleMenuSelect = (key: string) => {
  if (key !== route.path) {
    return navigateTo(key);
  }
};
</script>

<style scoped>
.app-layout {
  min-height: 100dvh;
}

.app-sider {
  min-height: 100dvh;
}

.brand {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}

.brand-collapsed {
  justify-content: center;
  padding-inline: 10px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  background: linear-gradient(135deg, #f36ca7, #59a8ff);
  font-weight: 800;
}

.brand-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
  line-height: 1.2;
}

.brand-copy strong {
  font-size: 16px;
}

.brand-copy span,
.header-title span {
  color: var(--n-text-color-3);
  font-size: 13px;
}

.side-menu {
  padding-block: 12px;
}

.main-layout {
  min-width: 0;
  min-height: 100dvh;
}

.app-header {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 24px;
}

.header-title {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.header-title strong {
  font-size: 18px;
}

.app-content {
  min-height: calc(100dvh - 121px);
  padding: 24px;
}

.app-footer {
  height: 49px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-3);
  font-size: 13px;
}

@media (width <= 720px) {
  .app-sider {
    position: sticky;
    left: 0;
    z-index: 10;
  }

  .app-header {
    padding: 0 16px;
  }

  .header-title span {
    display: none;
  }

  .app-content {
    padding: 16px;
  }
}
</style>
