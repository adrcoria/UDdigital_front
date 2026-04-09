<script lang="ts" setup>
import { ref } from "vue";
import QuerySearch from "@/app/common/components/filters/QuerySearch.vue";
import Listing from "./Listing.vue";

const search = ref("");
</script>

<template>
  <v-card variant="flat" border class="bg-white pa-4 mb-4">
    <v-row align="center" dense>
      <v-col cols="12" sm="6" md="4">
        <QuerySearch v-model="search" placeholder="Buscar por producto o marca..." />
      </v-col>
      <v-col cols="12" sm="6" md="auto" class="d-flex align-center">
        <v-btn color="secondary" rounded="md" @click="search = ''">
          Limpiar
          <i class="ph-funnel mx-1" />
        </v-btn>
      </v-col>
    </v-row>
  </v-card>

  <Listing :search="search" />
</template>
