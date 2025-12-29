<script lang="ts" setup>
import { computed } from "vue";
import { menuItems } from "@/components/layouts/utils";
import { useLayoutStore } from "@/store/app";
import { SIDEBAR_SIZE } from "@/app/const";
import { useRoute, useRouter } from "vue-router";

const state = useLayoutStore();
const route = useRoute();
const router = useRouter();

const path = computed(() => route.path);
const isCompactSideBar = computed(() => state.sideBarSize === SIDEBAR_SIZE.COMPACT);

const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
const userRole = user?.role?.uuid || "";

// Verifica si el usuario tiene acceso según los roles definidos
const hasAccess = (roles?: string[]) => {
  if (!roles) return true;        
  if (roles.length === 0) return true;
  return roles.includes(userRole);
};


// Filtra menú incluyendo lógica para headers
const filteredMenuItems = computed(() => {
  const hasAccess = (roles?: string[]) => {
    if (!roles) return false;
    return roles.length === 0 || roles.includes(userRole);
  };

  const result: any[] = [];
  let currentHeader: any = null;

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];

    if (item.isHeader) {
      currentHeader = { ...item, subItems: [] };
      continue;
    }

    let subMenu = [];
    if (item.subMenu) {
      subMenu = item.subMenu
        .map(sub => {
          if (sub.subMenu) {
            const filteredNested = sub.subMenu.filter(n => hasAccess(n.roles));
            return filteredNested.length > 0 || hasAccess(sub.roles)
              ? { ...sub, subMenu: filteredNested }
              : null;
          }
          return hasAccess(sub.roles) ? sub : null;
        })
        .filter(Boolean);
    }

    const canAccessItem = hasAccess(item.roles) || subMenu.length > 0;

    if (canAccessItem) {
      const finalItem = item.subMenu ? { ...item, subMenu } : item;
      if (currentHeader) {
        currentHeader.subItems.push(finalItem);
      } else {
        result.push(finalItem);
      }
    }

    const nextIsHeader = menuItems[i + 1]?.isHeader || i + 1 === menuItems.length;
    if (currentHeader && nextIsHeader) {
      if (currentHeader.subItems.length > 0) {
        result.push({ ...currentHeader });
        result.push(...currentHeader.subItems);
      }
      currentHeader = null;
    }
  }

  return result;
});





const onClick = (path: string, isSingleLevel?: boolean) => {
  if (isSingleLevel) {
    const openListEle = document.querySelector(".v-list-group--open");
    if (openListEle) {
      const titleEle = document.querySelector(".v-list-group--open .v-list-item--active");
      const listItemsEle: any = document.querySelector(".v-list-group--open .v-list-group__items");
      const appendIcon = document.querySelector(
        ".v-list-group--open .v-list-item--active .v-list-item__append .ph-caret-up"
      );
      if (titleEle && listItemsEle && appendIcon) {
        appendIcon.classList.remove("ph-caret-up");
        appendIcon.classList.add("ph-caret-down");
        listItemsEle.style.display = "none";
        titleEle.classList.remove("v-list-item--active");
        openListEle.classList.remove("v-list-group--open");
      }
    }
  }
  router.push(path);
};
</script>

<template>
  <v-container fluid class="py-0 px-3">
    <v-list class="navbar-nav h-100 vertical-menu-component pt-0" id="navbar-nav" open-strategy="single">
      <v-list-group
        v-for="(menuItem, index) in filteredMenuItems"
        :key="`${menuItem.label}-${index}`"
        :class="menuItem.isHeader ? 'menu-title' : 'nav-item'"
      >
        <template #activator="{ props }">
          <v-list-item
            v-if="menuItem.isHeader"
            :data-key="`${menuItem.label}`"
            prepend-icon=""
            class="px-2"
            variant="text"
            append-icon=""
          >
            <template #title>
              <div class="menu-title">{{ menuItem.label }}</div>
            </template>
          </v-list-item>

          <v-list-item
            v-if="!(menuItem.subMenu && menuItem.subMenu.length) && menuItem.link"
            :data-key="`${menuItem.label}`"
            append-icon=""
            class="py-0 ps-5"
            :value="menuItem.link"
            :active="menuItem.link === path"
            :to="menuItem.link"
            height="45"
            min-height="45"
            @click.prevent="menuItem.link && onClick(menuItem.link, true)"
          >
            <template #title>
              <router-link :to="menuItem.link">
                <div class="nav-link menu-link" :class="isCompactSideBar ? 'pa-2' : 'd-flex align-center'">
                  <i :class="menuItem.icon" class="ph-lg" />
                  <div>{{ menuItem.label }}</div>
                </div>
              </router-link>
            </template>
          </v-list-item>

          <v-list-item
            v-if="menuItem.subMenu && menuItem.subMenu.length"
            :data-key="`${menuItem.label}`"
            v-bind="props"
            class="py-0 nav-link ps-5 menu-header-title"
            height="45"
            min-height="45"
          >
            <template #title>
              <span class="nav-link menu-link" :class="isCompactSideBar ? 'pa-2' : 'd-flex align-center'">
                <i :class="menuItem.icon" class="ph-lg"></i>
                <span>{{ menuItem.label }}</span>
              </span>
            </template>
            <template #append="{ isActive }">
              <i
                v-if="!isCompactSideBar"
                :class="isActive ? 'ph ph-caret-up' : 'ph ph-caret-down'"
                class="ms-2"
              ></i>
            </template>
          </v-list-item>
        </template>

        <v-list-group
          v-for="(subMenu, index) in menuItem.subMenu"
          :key="`submenu-${subMenu.label}-${index}`"
          :value="subMenu.link"
          :active="subMenu.link === path"
          :to="subMenu.link"
        >
          <template #activator="{ props }">
            <v-list-item
              class="py-0 nav nav-sm nav-link sub-menu-list-item"
              density="compact"
              v-bind="props"
              :value="subMenu.link"
              :active="subMenu.link === path"
              :to="subMenu.link"
              height="38"
              min-height="38"
              @click.prevent="subMenu.link && onClick(subMenu.link)"
            >
              <template #title>
                <span class="nav-link menu-link py-0">{{ subMenu.label }}</span>
              </template>
              <template #append="{ isActive }">
                <i
                  v-if="!isCompactSideBar && subMenu.subMenu?.length"
                  :class="isActive ? 'ph ph-caret-up' : 'ph ph-caret-down'"
                ></i>
              </template>
            </v-list-item>
          </template>

          <v-list-item
            v-for="(nestedItem, index) in subMenu.subMenu"
            :key="index"
            class="py-0 nav nav-sm rail-navigation-list"
            density="compact"
            :to="nestedItem.link"
            height="38"
            min-height="38"
          >
            <template #title>
              <router-link v-if="nestedItem.link" :to="{ path: nestedItem.link }">
                <span class="nav-link menu-link py-0">{{ nestedItem.label }}</span>
              </router-link>
              <span v-else class="nav-link menu-link py-0">{{ nestedItem.label }}</span>
            </template>
          </v-list-item>
        </v-list-group>
      </v-list-group>
    </v-list>
  </v-container>
</template>
