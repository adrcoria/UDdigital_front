<script lang="ts" setup>
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import PersonalIndex from "@/components/personal/index.vue";

const breadcrumbItems = [
  { title: "Personal", disabled: false, href: "#" },
  { title: "Administrar", disabled: true, href: "#" },
];
</script>

<template>
  <Breadcrumb title="Gestión de Personal" :items="breadcrumbItems" />
  <PersonalIndex />
</template>
