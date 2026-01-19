<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/EmpresasModule/empresas/utils";
import TopFilters from "@/components/EmpresasModule/empresas/TopFilters.vue";
import Listing from "@/components/EmpresasModule/empresas/Listing.vue";
import { FilterType } from "@/components/EmpresasModule/empresas/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" /> 
</template>
