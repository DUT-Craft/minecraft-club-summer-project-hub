<template>
  <header class="site-header">
    <div class="wide-shell header-inner">
      <NuxtLink to="/app/pages" class="brand">
        <span class="brand-mark" aria-hidden="true">猫</span>
        <span class="brand-copy">
          <strong>猫娘社</strong>
          <small>暑假项目站</small>
        </span>
      </NuxtLink>

      <nav class="nav" aria-label="站点导航">
        <n-button quaternary class="nav-item" @click="navigateTo('/mall')">
          全部公开项目
        </n-button>
        <n-button quaternary class="nav-item" @click="navigateTo('/ideas')">
          想法墙
        </n-button>
        <n-button quaternary class="nav-item" @click="navigateTo('/submit')">
          投稿
        </n-button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 12px 0 0;
  border-top: 8px solid #5c318e;
  background: var(--n-color, #18181c);
}

.wide-shell {
  width: min(1360px, calc(100% - 32px));
  margin-inline: auto;
}

.header-inner {
  position: relative;
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 14px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 700;
  text-decoration: none;
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1;
}

.brand-copy {
  display: grid;
  gap: 2px;
  line-height: 1.1;
}

.brand-copy strong {
  color: rgba(255, 255, 255, 0.92);
  font-size: 16px;
  font-weight: 700;
}

.brand-copy small {
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  font-weight: 500;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.nav-item {
  height: 34px;
  padding: 0 14px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.nav-item :deep(.n-button__content) {
  font-weight: 500;
}

@media (width <= 720px) {
  .header-inner {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .nav-item {
    padding-inline: 8px;
  }
}
</style>
