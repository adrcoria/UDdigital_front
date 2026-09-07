<script lang="ts" setup>
import { computed } from "vue";
import type { SaleOrderItem } from "./types";

const props = defineProps<{
  items: SaleOrderItem[];
  submitting: boolean;
  isFormReady: boolean;
}>();

const emit = defineEmits<{
  (e: "remove", bovineId: string): void;
  (e: "weight", bovineId: string, weight: number): void;
  (e: "confirm"): void;
}>();

const total = computed(() =>
  props.items.reduce((acc, item) => acc + (item.saleValue || 0), 0)
);

const formatCurrency = (val: number) =>
  val.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
</script>

<template>
  <v-card height="100%" class="d-flex flex-column" elevation="2">
    <v-card-title class="bg-primary text-white pa-3">
      <v-icon icon="ph-shopping-cart" class="mr-2" />
      Orden de Venta
      <v-chip class="ml-2" size="small" color="white">
        {{ items.length }} animales
      </v-chip>
    </v-card-title>

    <v-card-text class="flex-grow-1 overflow-y-auto pa-2" style="max-height: 520px;">
      <div v-if="items.length === 0" class="text-center text-medium-emphasis py-10">
        <v-icon icon="ph-shopping-cart" size="48" class="mb-2" color="grey-lighten-1" />
        <div>Agrega animales desde la tabla</div>
      </div>

      <div v-for="item in items" :key="item.bovineId" class="mb-2 pa-2 rounded" style="background:#f9fafb; border:1px solid #e5e7eb;">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="font-weight-medium text-body-2">
            {{ item.internalEarTag }}
            <span v-if="item.siniigaEarTag" class="text-medium-emphasis">({{ item.siniigaEarTag }})</span>
          </span>
          <v-btn icon="ph-trash" size="x-small" variant="text" color="error" @click="emit('remove', item.bovineId)" />
        </div>
        <div class="text-caption text-medium-emphasis mb-2">
          {{ item.sex }} · {{ item.races }}
        </div>

        <div class="d-flex ga-3 align-center">
          <v-text-field
            :model-value="item.weight"
            label="Peso (kg)"
            type="number"
            min="0"
            step="0.01"
            density="compact"
            variant="outlined"
            suffix="kg"
            hide-details
            style="max-width: 130px;"
            @update:model-value="(v: any) => emit('weight', item.bovineId, Number(v) || 0)"
          />

          <!-- Valor de venta: calculado, no capturable -->
          <div class="flex-grow-1 text-end">
            <div class="text-caption text-medium-emphasis">Valor de venta</div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ formatCurrency(item.saleValue) }}
            </div>
            <div v-if="!item.weight" class="text-caption text-medium-emphasis">
              Captura el peso
            </div>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-text class="pa-3">
      <div class="d-flex justify-space-between align-center">
        <span class="font-weight-bold text-body-1">Total:</span>
        <span class="font-weight-bold text-h6 text-primary">{{ formatCurrency(total) }}</span>
      </div>
    </v-card-text>

    <v-card-actions class="pa-3 pt-0">
      <v-tooltip
        location="top"
        :text="!isFormReady ? 'Completa todos los campos y agrega animales' : ''"
        :disabled="isFormReady"
      >
        <template #activator="{ props: tp }">
          <div v-bind="tp" class="d-block w-100">
            <v-btn
              block
              color="success"
              size="large"
              :disabled="!isFormReady || submitting"
              :loading="submitting"
              prepend-icon="ph-check"
              @click="emit('confirm')"
            >
              Realizar Venta
            </v-btn>
          </div>
        </template>
      </v-tooltip>
    </v-card-actions>
  </v-card>
</template>
