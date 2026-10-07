<script lang="ts" setup>
import { permisosBreadcrumb } from "@/components/PermisosModule/permisos/utils";
import Permisos from "@/components/PermisosModule/permisos/index.vue";
</script>

<template>
  <Breadcrumb title="Permisos" :items="permisosBreadcrumb" />
  <Permisos />
</template>
