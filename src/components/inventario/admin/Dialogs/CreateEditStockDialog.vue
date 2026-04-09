<script setup lang="ts">
import { ref, watch } from "vue";
import { inventoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  item: any | null;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const loading = ref(false);
const loadingProducts = ref(false);
const formRef = ref(null);
const products = ref<any[]>([]);

const form = ref({
  idProduct: null as string | null,
  units: 0,
});

const rules = {
  required: (v: any) => !!v || "Este campo es obligatorio",
  positive: (v: any) => Number(v) > 0 || "Debe ser mayor a 0",
};

const loadProducts = async () => {
  try {
    loadingProducts.value = true;
    const res = await inventoryService.getProducts();
    products.value = res.data?.data || [];
  } catch {
    showErrorAlert("Error al cargar los productos");
  } finally {
    loadingProducts.value = false;
  }
};

watch(() => props.modelValue, async (val) => {
  dialog.value = val;
  if (val) {
    await loadProducts();
    if (props.item) {
      form.value = {
        idProduct: props.item.product?.id || props.item.idProduct || null,
        units: Number(props.item.units) || 0,
      };
    } else {
      form.value = { idProduct: null, units: 0 };
    }
  }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const save = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    loading.value = true;
    const payload = {
      idProduct: form.value.idProduct!,
      units: Number(form.value.units),
    };
    if (props.item?.id) {
      await inventoryService.updateInventory(props.item.id, payload);
      showSuccessAlert("Existencia actualizada");
    } else {
      await inventoryService.createInventory(payload);
      showSuccessAlert("Existencia registrada");
    }
    emit("refresh");
    dialog.value = false;
  } catch {
    showErrorAlert("Error al guardar el registro");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="pa-4 text-h6 font-weight-bold bg-grey-lighten-4">
        {{ item ? "Editar" : "Registrar" }} Existencia
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="formRef">
          <v-autocomplete
            label="Producto *"
            v-model="form.idProduct"
            :items="products"
            item-title="name"
            item-value="id"
            :rules="[rules.required]"
            :loading="loadingProducts"
            variant="outlined"
            density="comfortable"
            :disabled="!!item"
          >
            <template #item="{ props: p, item: prod }">
              <v-list-item v-bind="p"
                :title="prod.raw.name"
                :subtitle="`${prod.raw.brand?.name} · ${prod.raw.unitOfMeasure} · $${prod.raw.price}`"
              />
            </template>
          </v-autocomplete>

          <v-text-field
            label="Unidades *"
            v-model.number="form.units"
            type="number"
            :rules="[rules.required, rules.positive]"
            variant="outlined"
            density="comfortable"
            class="mt-3"
            min="1"
          />
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="plain" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
