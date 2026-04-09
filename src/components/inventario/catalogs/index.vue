<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

const activeCatalog = ref("products");
const search = ref("");
</script>

<template>
  <TopFilters v-model="activeCatalog" :search="search" @update:search="search = $event" />
  <Listing :catalog="activeCatalog" :search="search" class="mt-4" />
</template>
