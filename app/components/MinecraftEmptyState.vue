<template>
  <div class="empty">
    <div class="cube" aria-hidden="true" />
    <h3>{{ title }}</h3>
    <p v-if="text">{{ text }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  text?: string;
}>();
</script>

<style scoped>
.empty {
  padding: 26px;
  border: 2px dashed #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 218, 0.74);
  color: #4e3824;
  text-align: center;
}

.cube {
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  border: 2px solid #5a3a21;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0 50%, transparent 51%),
    #8bcf59;
  box-shadow: 6px 6px 0 #5a3a21;
}

h3 {
  margin: 0;
  font-size: 20px;
}

p {
  margin: 8px auto 0;
  max-width: 520px;
  line-height: 1.7;
}
</style>
