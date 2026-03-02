<script lang="ts" setup>
import { productBreadcrumb } from "@/components/loteEngorda/utils";
import Engorda from "@/components/loteEngorda/index.vue";
</script>
<template>
  <Breadcrumb title="Modulo de engorda" :items="productBreadcrumb" />
  <Engorda />
</template>
