<template>
  <n-layout class="app-layout">
    <n-layout-header bordered class="app-header">
      <div class="brand">
        <div class="brand-mark">MC</div>
        <div class="brand-copy">
          <strong>DUT Craft</strong>
          <span>暑假项目协作站</span>
        </div>
      </div>

      <n-menu
        mode="horizontal"
        :options="menuOptions"
        :value="activeMenuKey"
        responsive
        class="top-menu"
        @update:value="handleMenuSelect"
      />
    </n-layout-header>

    <n-layout-content class="app-content">
      <slot />
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import type { MenuOption } from "naive-ui";

const route = useRoute();

const menuOptions: MenuOption[] = [
  {
    label: "首页",
    key: "/",
  },
  {
    label: "全部公开项目",
    key: "/projects",
  },
  {
    label: "提交项目 / 想法",
    key: "/submit",
  },
  {
    label: "想法墙",
    key: "/ideas",
  },
];

const menuKeys = new Set(menuOptions.map((item) => String(item.key)));

const activeMenuKey = computed(() => {
  if (route.path.startsWith("/projects")) {
    return "/projects";
  }

  return menuKeys.has(route.path) ? route.path : "/";
});

const handleMenuSelect = (key: string) => {
  if (key !== route.path) {
    return navigateTo(key);
  }
};
</script>

<style scoped>
.app-layout {
  min-height: 100dvh;
  background: #dff0ff;
}

.app-header {
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 28px;
  background: rgba(255, 245, 207, 0.95);
  border-bottom: 2px solid #5a3a21;
}

.brand {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  color: #fffbe4;
  background: #5f9f46;
  box-shadow: 3px 3px 0 rgba(56, 38, 23, 0.18);
  font-weight: 900;
}

.brand-copy {
  display: grid;
  gap: 2px;
  line-height: 1.2;
}

.brand-copy strong {
  color: #2d2418;
  font-size: 17px;
  font-weight: 900;
}

.brand-copy span {
  color: #795b36;
  font-size: 13px;
}

.top-menu {
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
  border-bottom: 0;
  background: transparent;
}

.app-content {
  min-height: calc(100dvh - 72px);
}

@media (width <= 720px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
  }

  .top-menu {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
