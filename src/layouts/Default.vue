<script lang="ts" setup>
import RightSideBar from "@/components/layouts/rightSidebar/index.vue";
import LeftSideBar from "@/components/layouts/leftSideBar/index.vue";
import TopBar from "@/components/layouts/topBar/index.vue";
import { useLayoutStore } from "@/store/app";
import { computed } from "vue";
import { LAYOUTS } from "@/app/const";
const state = useLayoutStore();

const isHorizontal = computed(() => {
  return state.layoutType === LAYOUTS.HORIZONTAL;
});
</script>
<template>
  <div>
    <RightSideBar v-if="$vuetify.display.mdAndUp" />
    <v-layout
      class="main-layout-wrapper justify-center position-relative"
      id="layout-wrapper"
    >
      <LeftSideBar />
      <TopBar />
      <v-main app>
        <v-container
          :class="!isHorizontal ? 'pt-0' : ''"
          :fluid="!isHorizontal"
          class="main-container"
        >
          <router-view />
        </v-container>
      </v-main>
      <v-footer app class="footer">
        <v-container fluid>
          <v-row>
            <v-col class="pa-0">
              {{ new Date().getFullYear() }} © Alsagro.
            </v-col>
            <v-col class="pa-0">
              <div class="text-sm-end d-none d-sm-block">
                Desarrollado por Leonix
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-footer>
    </v-layout>
  </div>
</template>
