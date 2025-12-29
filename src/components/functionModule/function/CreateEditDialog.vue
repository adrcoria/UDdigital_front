<script setup lang="ts">
import { computed, onMounted, ref, reactive } from "vue";
import { v4 as uuidv4 } from "uuid";
import { defineProps, defineEmits } from "vue";
import Swal from "sweetalert2";
import { get } from "http";
import { specieService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

// Asegúrate de que el componente Card esté importado o registrado globalmente
// import Card from "@/components/Card.vue";

// ===================================================================
// 1. Props & Emits
// ===================================================================
const emit = defineEmits(["update:modelValue", "onUpdate", "onCreate"]);
const prop = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  selectedDetail: {
    type: Object,
    default: () => ({}),
  },
  loading: { type: Boolean, default: false },
});

const species = ref<any[]>([]);



// ===================================================================
// 2. Estado del modal (Abrir/Cerrar) y si es creación o edición
// ===================================================================
const dialogValue = computed({
  get: () => prop.modelValue,
  set: (val: boolean) => emit("update:modelValue", val),
});

const isCreate = computed(() => !prop.selectedDetail?.uuid);

// ===================================================================
// 3. Objeto reactivo con los campos de formulario
// ===================================================================
const form = reactive({
  uuid: prop.selectedDetail?.uuid || "",
  name: prop.selectedDetail?.name || "",
  code: prop.selectedDetail?.code || "",
  uuid_specie:  "",
});

// ===================================================================
// 4. Roles (combo) y carga inicial
// ===================================================================
// const roles = ref<any[]>([]);

const loadSpecie = ref(false); // Define loadSpecie as a ref

onMounted(() => {
  getSpecies();
});



// ===================================================================
// 6. Validaciones simples para <v-form>
// ===================================================================
const requiredRule = [(v: string) => !!v || "Este campo es requerido"];


const formRef = ref();

// ===================================================================
// 7. Crear o Actualizar
// ===================================================================

const getSpecies = async () => {
  loadSpecie.value = true;
  try {
    const response = await specieService.get();
    species.value = response.data.data.map((data: any) => ({
      value: data.uuid,
      title: data.name,
    }));
    form.uuid_specie = prop.selectedDetail?.specie?.uuid  || "";
    
  } catch (error) {
    // console.error("Error al obtener roles:", error);
  } finally {
    loadSpecie.value = false;
  }
};

const onCreateUpdate = async () => {
  if (formRef.value) {
    const result = await formRef.value.validate();
    if (!result.valid) {
      return;
    }
  }

  if (!isCreate.value) {
    // Modo Actualizar
    emit("onUpdate", {
      uuid: form.uuid,
      name: form.name,
      code: form.code,
      uuid_specie: form.uuid_specie
    });
  } else {
    // Modo Crear
    const payload = {
      uuid: "",
      name: form.name,
      code: form.code,
      uuid_specie: form.uuid_specie

    };
    emit("onCreate", payload);
    dialogValue.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialogValue" width="600" persistent scrollable>
    <Card :title="isCreate ? 'Crear registro' : 'Editar registro'" title-class="bg-light text-center">
      <template #title-action>
        <v-btn icon="ph-x" variant="plain" density="compact" @click="dialogValue = false" />
      </template>
      <v-form ref="formRef">
        <v-card-text data-simplebar style="max-height: calc(100vh - 400px)">
          <v-row>
            <v-col cols="6">
              <v-select v-model="form.uuid_specie" :loading="loadSpecie" :items="species" item-text="title"
                item-value="value" :rules="requiredRule" label="Especie" variant="outlined" density="compact"
                class="mb-2 custom-label" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.name" density="compact" :rules="requiredRule" label="Función"
                class="mb-2 custom-label" variant="outlined" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="form.code" density="compact" :rules="requiredRule" label="Código"
                class="mb-2 custom-label" variant="outlined" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="d-flex justify-end px-5 pb-3">
          <v-btn color="light" elevation="0" variant="elevated" @click="dialogValue = false">
            Cerrar
          </v-btn>
          <v-btn :loading="prop.loading" color="success" elevation="0" variant="elevated" @click="onCreateUpdate">
            {{ isCreate ? "Agregar" : "Actualizar" }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </Card>
  </v-dialog>
</template>

<style scoped>
/* Placeholder / Label color */
::v-deep .custom-label:not(.v-text-field--is-focused) .v-label {
  color: #9e9e9e !important;
  font-size: 12px !important;
}

/* Estilos error */
.is-invalid .v-field__control,
.is-invalid .v-field__input {
  border-color: #f44336 !important;
}

.invalid-feedback {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 4px;
}
</style>
