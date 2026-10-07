<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "@/components/EmpresasModule/empresas/TopFilters.vue";
import Listing from "@/components/RolesModule/roles/Listing.vue";

const filters = ref({ query: "", brands: [], category: "", discount: "" });
</script>

<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" />
</template>
