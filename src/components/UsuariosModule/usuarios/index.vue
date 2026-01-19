<script lang="ts" setup>
import { ref } from "vue";
import { filter } from "@/components/UsuariosModule/usuarios/utils";
import TopFilters from "@/components/UsuariosModule/usuarios/TopFilters.vue";
import Listing from "@/components/UsuariosModule/usuarios/Listing.vue";
import { FilterType } from "@/components/UsuariosModule/usuarios/types";

const filters = ref<FilterType>(filter);
</script>
<template>
  <TopFilters class="mb-4" v-model="filters" />
  <Listing :filters="filters" /> 
</template>
