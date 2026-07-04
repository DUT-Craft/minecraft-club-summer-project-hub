<template>
  <n-config-provider :theme-overrides="minecraftThemeOverrides">
    <n-message-provider>
      <NuxtRouteAnnouncer />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import type { GlobalThemeOverrides } from "naive-ui";

const minecraftThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: "#65a844",
    primaryColorHover: "#76b957",
    primaryColorPressed: "#4f8c35",
    primaryColorSuppl: "#65a844",
    borderRadius: "8px",
    borderColor: "#5a3a21",
    textColorBase: "#2d2418",
    textColor1: "#2d2418",
    textColor2: "#60462b",
    textColor3: "#795b36",
    bodyColor: "#dff0ff",
    cardColor: "#fff5cf",
    modalColor: "#fff5cf",
    popoverColor: "#fff8df",
    fontWeightStrong: "900",
    boxShadow1: "4px 4px 0 rgba(56, 38, 23, 0.12)",
    boxShadow2: "6px 6px 0 rgba(56, 38, 23, 0.16)",
    boxShadow3: "8px 8px 0 rgba(56, 38, 23, 0.18)",
  },
  Button: {
    borderRadiusMedium: "8px",
    borderRadiusLarge: "8px",
    heightMedium: "50px",
    heightLarge: "58px",
    fontWeight: "900",
    paddingMedium: "0 20px",
    paddingLarge: "0 22px",
    colorPrimary: "#5f9f46",
    colorHoverPrimary: "#6eb557",
    colorPressedPrimary: "#4d873a",
    borderPrimary: "2px solid #5a3a21",
    borderHoverPrimary: "2px solid #5a3a21",
    borderPressedPrimary: "2px solid #5a3a21",
    colorSecondary: "#ffe08a",
    colorSecondaryHover: "#ffe79f",
    colorSecondaryPressed: "#e7c875",
    textColorPrimary: "#fffbe4",
    textColorHoverPrimary: "#fffbe4",
    textColorPressedPrimary: "#fffbe4",
    textColorTextPrimary: "#37752f",
  },
  Card: {
    borderRadius: "10px",
    color: "rgba(255, 245, 207, 0.92)",
    colorEmbedded: "rgba(255, 248, 223, 0.94)",
    paddingMedium: "0",
    borderColor: "#5a3a21",
    boxShadow: "4px 4px 0 rgba(56, 38, 23, 0.12)",
  },
  Tag: {
    borderRadius: "7px",
    fontWeightStrong: "900",
    color: "rgba(255, 248, 223, 0.96)",
    textColor: "#2d2418",
    border: "2px solid #5a3a21",
    heightMedium: "28px",
    padding: "0 9px",
  },
  Statistic: {
    labelTextColor: "#60462b",
    valueTextColor: "#2d2418",
    labelFontSize: "14px",
    valueFontSize: "32px",
  },
};
</script>
