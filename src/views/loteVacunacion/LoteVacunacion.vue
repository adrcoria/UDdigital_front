<script lang="ts" setup>
import { vacunacionBreadcrumb } from "@/components/loteVacunacion/utils";
import Vacunacion from "@/components/loteVacunacion/index.vue";
</script>

<template>
  <Breadcrumb title="Módulo de Vacunación" :items="vacunacionBreadcrumb" />
  <Vacunacion />
</template>
