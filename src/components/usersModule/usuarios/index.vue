<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/usersModule/usuarios/utils";
import TopFilters from "@/components/usersModule/usuarios/TopFilters.vue";
import Listing from "@/components/usersModule/usuarios/Listing.vue";
import { FilterType } from "@/components/usersModule/usuarios/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" /> 
</template>
