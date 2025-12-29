<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/ContabilidadModule/contabilidad/utils";
import TopFilters from "@/components/ContabilidadModule/contabilidad/TopFilters.vue";
import Listing from "@/components/ContabilidadModule/contabilidad/Listing.vue";
import { FilterType } from "@/components/ContabilidadModule/contabilidad/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" /> 
</template>
