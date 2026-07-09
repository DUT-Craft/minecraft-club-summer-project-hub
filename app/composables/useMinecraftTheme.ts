import type { GlobalThemeOverrides } from "naive-ui";

/**
 * 公开页面共用的 Minecraft 暖色主题。
 *
 * app.vue 用的是全局暗色主题（darkTheme），但 mall / ideas / project[id] / submit
 * 等公开页是浅色羊皮纸风格。每个页面用局部 <n-config-provider :theme="null">
 * 切回浅色，并通过这里的 themeOverrides 把 Naive UI 组件统一染成草地绿主色 +
 * 羊皮纸卡片 + 木边输入/下拉，避免每个页面各自维护一份重复的覆盖配置。
 */
export const minecraftPrimaryGreen = "#65a844";

// 输入框共用样式：羊皮纸底 + 木边 + 草地绿聚焦边。Input 与 InputNumber 的内层 Input 共享。
const inputTheme: GlobalThemeOverrides["Input"] = {
  color: "#fff8df",
  border: "2px solid #5a3a21",
  borderHover: `2px solid ${minecraftPrimaryGreen}`,
  borderFocus: `2px solid ${minecraftPrimaryGreen}`,
  borderRadius: "8px",
  textColor: "#2d2418",
  placeholderColor: "#795b36",
};

const panelThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: minecraftPrimaryGreen,
    primaryColorHover: "#76b850",
    primaryColorPressed: "#54903a",
    primaryColorSuppl: minecraftPrimaryGreen,
  },
  Card: {
    color: "rgba(255, 245, 207, 0.94)",
    titleTextColor: "#2d2418",
    textColor: "#4f3924",
    borderRadius: "10px",
  },
  Input: inputTheme,
  InputNumber: {
    peers: {
      Input: inputTheme,
    },
  },
  Select: {
    peers: {
      InternalSelection: {
        color: "#fff8df",
        colorActive: "#fff8df",
        border: "2px solid #5a3a21",
        borderHover: `2px solid ${minecraftPrimaryGreen}`,
        borderActive: `2px solid ${minecraftPrimaryGreen}`,
        borderFocus: `2px solid ${minecraftPrimaryGreen}`,
        borderRadius: "8px",
        textColor: "#2d2418",
      },
    },
  },
};

export const useMinecraftTheme = () => ({
  themeOverrides: panelThemeOverrides,
  primaryGreen: minecraftPrimaryGreen,
});
