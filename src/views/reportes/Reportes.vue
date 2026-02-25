<script lang="ts" setup>
import { productBreadcrumb } from "@/components/reportesModule/reportes/utils";
import Reportes from "@/components/reportesModule/reportes/index.vue";
</script>
<template>
  <Breadcrumb title="Reportes" :items="productBreadcrumb" />
  <Reportes />
</template>
