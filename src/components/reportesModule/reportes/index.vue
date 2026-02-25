<script lang="ts" setup>
import { ref } from "vue";
import TopFilters from "./TopFilters.vue";
import Listing from "./Listing.vue";

const filters = ref({
  reportType: null,
  companyId: null,
  accountId: null,
  categoryId: null,
  conceptId: null,
  dateFrom: new Date().toISOString().split('T')[0],
  dateTo: new Date().toISOString().split('T')[0],
});
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center mb-6">
      <v-icon size="32" color="primary" class="mr-3">ph-file-spreadsheet</v-icon>
      <div class="text-h5 font-weight-black text-uppercase">Reportes Operativos</div>
    </div>
    
    <TopFilters v-model="filters" />
    <Listing :filters="filters" />
  </div>
</template>