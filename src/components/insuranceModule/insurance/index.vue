<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/insuranceModule/insurance/utils";
import TopFilters from "@/components/insuranceModule/insurance/TopFilters.vue";
import Listing from "@/components/insuranceModule/insurance/Listing.vue";
import { FilterType } from "@/components/insuranceModule/insurance/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" /> 
</template>
