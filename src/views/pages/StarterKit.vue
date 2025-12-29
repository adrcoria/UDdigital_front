<script lang="ts" setup>
const breadcrumb = [
  {
    title: "pages",
    disabled: false,
  },
  {
    title: "starter",
    disabled: true,
  },
];
</script>
<template>
  <Breadcrumb title="Starter" :items="breadcrumb" />
</template>
