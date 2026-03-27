<script lang="ts" setup>
import { productBreadcrumb } from "@/components/loteEngorda/utils";
import Leche from "@/components/loteLeche/index.vue";
</script>
<template>
  <Breadcrumb title="Módulo de Producción de Leche" :items="productBreadcrumb" />
  <Leche />
</template>
