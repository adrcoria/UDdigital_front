<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

// Catálogo activo
const activeCatalog = ref("bovine-purpose");

// Estado del buscador
const search = ref("");
</script>

<template>
  <TopFilters v-model="activeCatalog" :search="search" @update:search="search = $event" />

  <Listing :catalog="activeCatalog" :search="search" />
</template>
