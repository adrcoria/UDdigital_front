<script lang="ts" setup>
import MatrizPermisos from "./MatrizPermisos.vue";

/**
 * El módulo solo asigna secciones a roles.
 *
 * Las secciones NO se administran desde aquí: son estructura del sistema y
 * se cargan en base de datos con scripts/web-sections.sql. Por eso esta
 * pantalla no expone el CRUD de secciones, aunque el servicio lo soporte.
 */
</script>

<template>
  <MatrizPermisos />
</template>
