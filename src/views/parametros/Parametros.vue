<script lang="ts" setup>
import { parametrosBreadcrumb } from "@/components/ParametrosModule/parametros/utils";
import Parametros from "@/components/ParametrosModule/parametros/index.vue";
</script>

<template>
  <Breadcrumb title="Parámetros generales" :items="parametrosBreadcrumb" />
  <Parametros />
</template>
