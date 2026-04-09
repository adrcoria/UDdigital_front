<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { inventoryService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{
  modelValue: boolean;
  item: any | null;
  catalog: string; // "products" | "brands" | "subcategories"
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = ref(false);
const loading = ref(false);
const formRef = ref(null);

const brands = ref<any[]>([]);
const subcategories = ref<any[]>([]);
const loadingCatalogs = ref(false);

const form = ref({
  name: "",
  idBrand: null as string | null,
  price: 0,
  unitOfMeasure: "",
  idProductSubcategory: null as string | null,
});

const rules = {
  required: (v: any) => !!v || "Este campo es obligatorio",
  positive: (v: any) => Number(v) > 0 || "Debe ser mayor a 0",
};

const unitsOfMeasure = [
  "Barril (bbl)",
  "Bolsa",
  "Caja",
  "Centímetro (cm)",
  "Cubeta",
  "Día",
  "Docena (doc)",
  "Galón (gal)",
  "Gramo (g)",
  "Hectárea (ha)",
  "Hora (h)",
  "Kilogramo (kg)",
  "Libra (lb)",
  "Litro (L)",
  "Mes",
  "Metro (m)",
  "Metro cuadrado (m²)",
  "Miligramo (mg)",
  "Mililitro (mL)",
  "Milímetro (mm)",
  "Onza (oz)",
  "Paquete",
  "Par",
  "Pie (ft)",
  "Pieza (pza)",
  "Pulgada (in)",
  "Rollo",
  "Saco",
  "Semana",
  "Tonelada (t)",
  "Unidad (ud)",
];

const isProduct = computed(() => props.catalog === "products");

const loadDependencies = async () => {
  if (!isProduct.value) return;
  try {
    loadingCatalogs.value = true;
    const [resBrands, resSubs] = await Promise.all([
      inventoryService.getBrands(),
      inventoryService.getSubcategories(),
    ]);
    brands.value = resBrands.data?.data || [];
    subcategories.value = resSubs.data?.data || [];
  } catch {
    showErrorAlert("Error al cargar catálogos dependientes");
  } finally {
    loadingCatalogs.value = false;
  }
};

const resetForm = () => {
  form.value = { name: "", idBrand: null, price: 0, unitOfMeasure: "", idProductSubcategory: null };
};

watch(() => props.modelValue, async (val) => {
  dialog.value = val;
  if (val) {
    resetForm();
    await loadDependencies();
    if (props.item) {
      form.value = {
        name: props.item.name || "",
        idBrand: props.item.brand?.id || props.item.idBrand || null,
        price: Number(props.item.price) || 0,
        unitOfMeasure: props.item.unitOfMeasure || "",
        idProductSubcategory: props.item.productSubcategory?.id || props.item.idProductSubcategory || null,
      };
    }
  }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const save = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    loading.value = true;
    if (props.catalog === "products") {
      const payload = {
        name: form.value.name,
        idBrand: form.value.idBrand!,
        price: Number(form.value.price),
        unitOfMeasure: form.value.unitOfMeasure,
        idProductSubcategory: form.value.idProductSubcategory!,
      };
      if (props.item?.id) {
        await inventoryService.updateProduct(props.item.id, payload);
      } else {
        await inventoryService.createProduct(payload);
      }
    } else if (props.catalog === "brands") {
      const payload = { name: form.value.name };
      if (props.item?.id) {
        await inventoryService.updateBrand(props.item.id, payload);
      } else {
        await inventoryService.createBrand(payload);
      }
    } else if (props.catalog === "subcategories") {
      const payload = { name: form.value.name };
      if (props.item?.id) {
        await inventoryService.updateSubcategory(props.item.id, payload);
      } else {
        await inventoryService.createSubcategory(payload);
      }
    }

    showSuccessAlert(props.item?.id ? "Registro actualizado" : "Registro guardado");
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
  <v-dialog v-model="dialog" max-width="550px" persistent>
    <v-card>
      <v-card-title class="pa-4 text-h6 font-weight-bold bg-grey-lighten-4">
        {{ item ? "Editar" : "Registrar" }} {{ catalog === "products" ? "Producto" : catalog === "brands" ? "Marca" : "Categoría" }}
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="formRef">
          <v-text-field
            label="Nombre *"
            v-model="form.name"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
          />

          <template v-if="isProduct">
            <v-autocomplete
              label="Marca *"
              v-model="form.idBrand"
              :items="brands"
              item-title="name"
              item-value="id"
              :rules="[rules.required]"
              :loading="loadingCatalogs"
              variant="outlined"
              density="comfortable"
              class="mt-3"
            />
            <v-autocomplete
              label="Categoría *"
              v-model="form.idProductSubcategory"
              :items="subcategories"
              item-title="name"
              item-value="id"
              :rules="[rules.required]"
              :loading="loadingCatalogs"
              variant="outlined"
              density="comfortable"
              class="mt-3"
            />
            <v-row dense class="mt-1">
              <v-col cols="6">
                <v-text-field
                  label="Precio *"
                  v-model.number="form.price"
                  type="number"
                  :rules="[rules.required, rules.positive]"
                  variant="outlined"
                  density="comfortable"
                  prefix="$"
                />
              </v-col>
              <v-col cols="6">
                <v-autocomplete
                  label="Unidad de medida *"
                  v-model="form.unitOfMeasure"
                  :items="unitsOfMeasure"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Selecciona o escribe..."
                />
              </v-col>
            </v-row>
          </template>
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
