<script lang="ts" setup>
import { rancherosBreadcrumb } from "@/components/RancherosModule/rancheros/utils";
import Rancheros from "@/components/RancherosModule/rancheros/index.vue";
</script>
<template>
  <Breadcrumb title="Módulo de Rancheros" :items="rancherosBreadcrumb" />
  <Rancheros />
</template>
