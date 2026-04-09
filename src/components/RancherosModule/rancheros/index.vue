<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/RancherosModule/rancheros/utils";
import TopFilters from "@/components/RancherosModule/rancheros/TopFilters.vue";
import Listing from "@/components/RancherosModule/rancheros/Listing.vue";
import { FilterType } from "@/components/RancherosModule/rancheros/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" />
</template>
