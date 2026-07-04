<template>
  <header class="site-header">
    <div class="wide-shell header-inner">
      <NuxtLink to="/projects" class="brand">
        <span class="brand-mark" aria-hidden="true">
          猫
        </span>
        <span class="brand-copy">
          <strong>猫娘社</strong>
          <small>暑假项目站</small>
        </span>
      </NuxtLink>

      <nav class="nav" aria-label="站点导航">
        <NuxtLink class="nav-item" to="/projects/groud">
          全部公开项目
        </NuxtLink>
        <NuxtLink class="nav-item" to="/ideas">
          想法墙
        </NuxtLink>
        <NuxtLink class="nav-item" to="/submit">
          投稿
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 12px 0 0;
  border-top: 8px solid #5c318e;
  background:
    linear-gradient(#fffdf4, #fffdf4) padding-box,
    linear-gradient(90deg, rgba(189, 233, 255, 0.58), rgba(255, 244, 185, 0.58)) border-box;
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
  border: 3px solid #5a3a21;
  border-radius: 8px;
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 232, 135, 0.28), transparent 20rem),
    linear-gradient(90deg, rgba(255, 248, 218, 0.96), rgba(255, 248, 218, 0.84));
  box-shadow: 0 6px 0 #5a3a21;
  padding: 10px 14px;
}

.header-inner::before {
  position: absolute;
  left: 50%;
  top: -22px;
  width: 90px;
  height: 22px;
  content: "";
  border-radius: 0 0 12px 12px;
  background: #000;
  transform: translateX(-50%);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #173318;
  font-weight: 950;
  text-decoration: none;
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 2px solid #382617;
  border-radius: 5px;
  background: linear-gradient(180deg, #93d65a, #55a63a);
  color: #fff8dc;
  font-size: 15px;
  line-height: 1;
  text-shadow: 1px 1px 0 #2d501f;
  box-shadow: 3px 3px 0 rgba(56, 38, 23, 0.18);
}

.brand-copy {
  display: grid;
  gap: 2px;
  line-height: 1.1;
}

.brand-copy strong {
  color: #173318;
  font-size: 16px;
  font-weight: 950;
}

.brand-copy small {
  color: #6b5a36;
  font-size: 12px;
  font-weight: 850;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.nav-item {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 7px;
  background: #ffd873;
  padding: 0 14px;
  color: #2f2a17;
  font-size: 14px;
  font-weight: 950;
  text-decoration: none;
  box-shadow: inset 0 -2px 0 rgba(56, 38, 23, 0.1);
  transition:
    transform 150ms ease,
    background 150ms ease;
}

.nav-item:hover,
.nav-item.router-link-active {
  transform: translateY(-1px);
  background: #ffe28c;
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
