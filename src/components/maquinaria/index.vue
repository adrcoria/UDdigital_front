<script lang="ts" setup>
import { ref, reactive } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

const filters = reactive({ query: "" });
const listingRef = ref<InstanceType<typeof Listing> | null>(null);

const handleSearch = (val: string) => { filters.query = val; };
const handleCreate = () => listingRef.value?.openCreate();
</script>

<template>
  <v-container fluid class="pt-0">
    <TopFilters @search="handleSearch" @create="handleCreate" />
    <Listing ref="listingRef" :filters="filters" />
  </v-container>
</template>
