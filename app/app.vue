<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <NuxtRouteAnnouncer/>
      <NuxtLayout>
        <NuxtPage/>
      </NuxtLayout>
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import {darkTheme} from "naive-ui";
</script>
