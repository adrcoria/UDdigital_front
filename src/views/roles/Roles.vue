<script lang="ts" setup>
import { rolesBreadcrumb } from "@/components/RolesModule/roles/utils";
import Roles from "@/components/RolesModule/roles/index.vue";
</script>

<template>
  <Breadcrumb title="Roles" :items="rolesBreadcrumb" />
  <Roles />
</template>
