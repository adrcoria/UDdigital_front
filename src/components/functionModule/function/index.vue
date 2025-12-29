<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/functionModule/function/utils";
import TopFilters from "@/components/functionModule/function/TopFilters.vue";
import Listing from "@/components/functionModule/function/Listing.vue";
import { FilterType } from "@/components/functionModule/function/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" /> 
</template>
