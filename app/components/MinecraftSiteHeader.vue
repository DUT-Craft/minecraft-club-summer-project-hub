<template>
  <n-card
    :bordered="false"
    class="mc-header"
    content-style="padding: 0; display: flex; align-items: center; justify-content: space-between; gap: 14px;"
  >
    <NuxtLink to="/app/pages" class="brand">
      <n-tag :bordered="false" class="brand-mark">猫</n-tag>
      <span>
        <strong>猫娘社</strong>
        <small>暑假项目站</small>
      </span>
    </NuxtLink>

    <nav class="nav">
      <n-button secondary class="nav-button" @click="navigateTo('/mall')">全部公开项目</n-button>
      <n-button secondary class="nav-button" @click="navigateTo('/ideas')">想法墙</n-button>
      <n-button secondary class="nav-button" @click="navigateTo('/submit')">投稿</n-button>
    </nav>
  </n-card>
</template>

<style scoped>
.mc-header {
  width: min(1180px, calc(100% - 28px));
  margin: 14px auto 0;
  padding: 10px 12px;
  display: flex;
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: rgba(255, 247, 214, 0.92);
  box-shadow: 0 5px 0 #5a3a21;
  position: relative;
  z-index: 5;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #2d2418;
  text-decoration: none;
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 2px solid #5a3a21;
  border-radius: 6px;
  background: #7abf4b;
  color: #fffbe4;
  font-weight: 900;
  box-shadow: inset -4px -4px 0 rgba(45, 36, 24, 0.18);
}

.brand strong,
.brand small {
  display: block;
  line-height: 1.1;
}

.brand small {
  margin-top: 3px;
  color: #795b36;
  font-size: 12px;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.nav-button {
  height: auto;
  padding: 8px 11px;
  border: 2px solid transparent;
  border-radius: 8px;
  color: #3d2c1c;
  font-weight: 800;
}

.nav-button:hover {
  border-color: #5a3a21;
  background: #ffdf7e;
}

@media (width <= 680px) {
  .mc-header :deep(.n-card__content) {
    align-items: flex-start !important;
    flex-direction: column;
  }

  .nav {
    justify-content: flex-start;
  }
}
</style>
