<script lang="ts" setup>
const breadcrumb = [
  {
    title: "Inicio",
    disabled: false,
  },
  {
    title: "Bienvenida",
    disabled: true,
  },
];
</script>
<template>
  <Breadcrumb title="Bienvenidos" :items="breadcrumb" />
</template>
