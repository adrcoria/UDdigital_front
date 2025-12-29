<script lang="ts" setup>
import { productBreadcrumb } from "@/components/usersModule/usuarios/utils";
import Usuarios from "@/components/usersModule/usuarios/index.vue";
</script>
<template>
  <Breadcrumb title="Usuarios" :items="productBreadcrumb" />
  <Usuarios />
</template>
