<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { LAYOUTS, DIR } from "@/app/const";
import {
  gradientColors,
  layoutsOptions,
  themesOptions,
  modesOptions,
  widthOptions,
  layoutPositionOptions,
  topBarColorOptions,
  sidebarSizeOptions,
  sidebarColorOptions,
  sideBarImageOptions,
} from "@/components/layouts/rightSidebar/utils";
import { useLayoutStore } from "@/store/app";
import { useTheme, useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const drawer = ref(!smAndDown.value);
const state = useLayoutStore();
const theme = useTheme();
const gradient = ref(state.sideBarColor);

watch(drawer, (newValue: boolean) => {
  const element = document.querySelector("html");
  if (element) {
    if (newValue) {
      element.style.overflow = "hidden";
    } else {
      element.style.overflow = "auto";
    }
  }
});

const layoutType = ref(state.layoutType);

const setSiteTheme = () => {
  const mode = state.mode;
  const layoutTheme = state.layoutTheme;
  if (mode === "dark") {
    theme.global.name.value =
      layoutTheme === "default"
        ? "defaultThemeDark"
        : state.layoutTheme + "Dark";
  } else {
    theme.global.name.value =
      layoutTheme === "default" ? "defaultTheme" : state.layoutTheme;
  }
};

const onComponentChange = (key: any) => {
  const value = state[`${key}`];
  switch (key) {
    case "layoutType":
      layoutType.value = value;
      state.changeLayoutType(value);
      break;

    case "layoutTheme":
      state.changeLayoutTheme(value);
      setSiteTheme();
      break;

    case "mode":
      state.changeMode(value);
      setSiteTheme();
      break;

    case "layoutWidth":
      state.changeLayoutWidth(value);
      break;

    case "position":
      state.changeLayoutPosition(value);
      break;

    case "topBarColor":
      state.changeTopBarColor(value);
      break;

    case "sideBarSize":
      state.changeSideBarSize(value);
      break;

    case "sideBarImage":
      state.changeSideBarImage(value);
      break;

    default:
      break;
  }
};

const onComponentClick = (value: any, key: any) => {
  switch (key) {
    case "layoutType":
      layoutType.value = value;
      state.changeLayoutType(value);

      break;

    case "layoutWidth":
      state.changeLayoutWidth(value);
      break;

    case "topBarColor":
      state.changeTopBarColor(value);
      break;

    case "sideBarSize":
      state.changeSideBarSize(value);
      break;

    case "sideBarColor":
      state.changeSideBarColor(value);
      gradient.value = value;
      break;

    default:
      break;
  }
};

const isRtl = computed(() => {
  return state.dir === DIR.RTL;
});

const onGradientColorChange = (gradientColor: string) => {
  gradient.value = gradientColor;
  document.documentElement.setAttribute("data-sidebar", gradientColor);
};
</script>

<template>
  <v-layout class="right-sidebar-layout">
   
  </v-layout>
</template>
