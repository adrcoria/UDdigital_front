<script lang="ts" setup>
import { productBreadcrumb } from "@/components/EmpresasModule/empresas/utils";
import Empresas from "@/components/EmpresasModule/empresas/index.vue";
</script>
<template>
  <Breadcrumb title="Módulo de empresas" :items="productBreadcrumb" />
  <Empresas />
</template>
