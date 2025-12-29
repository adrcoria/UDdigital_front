<script lang="ts" setup>
import { productBreadcrumb } from "@/components/ContabilidadModule/contabilidad/utils";
import Contabilidad from "@/components/ContabilidadModule/contabilidad/index.vue";
</script>
<template>
  <Breadcrumb title="Ingresos y egresos" :items="productBreadcrumb" />
  <Contabilidad />
</template>
