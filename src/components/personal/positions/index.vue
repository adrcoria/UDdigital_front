<script lang="ts" setup>
import { ref } from "vue";
import Listing from "./Listing.vue";

const listingRef = ref<InstanceType<typeof Listing> | null>(null);
const handleCreate = () => listingRef.value?.openCreate();
</script>

<template>
  <v-container fluid class="pt-0">
    <v-card class="mb-3" elevation="1">
      <v-card-text class="pa-3 d-flex justify-end">
        <v-btn color="primary" prepend-icon="ph-plus" @click="handleCreate">
          Nuevo puesto
        </v-btn>
      </v-card-text>
    </v-card>

    <Listing ref="listingRef" />
  </v-container>
</template>
