<script lang="ts" setup>
import { productBreadcrumb } from "@/components/UsuariosModule/usuarios/utils";
import Usuarios from "@/components/UsuariosModule/usuarios/index.vue";
</script>
<template>
  <Breadcrumb title="Modulo de usuarios" :items="productBreadcrumb" />
  <Usuarios />
</template>
