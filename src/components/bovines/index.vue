<script lang="ts" setup>
import { reactive } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

const filters = reactive({
  query: "",
});

const handleSearch = (val: string) => {
  filters.query = val;
};
</script>

<template>
  <v-container fluid class="pt-0">
    <TopFilters @search="handleSearch" />
    
    <Listing :filters="filters" />
  </v-container>
</template>