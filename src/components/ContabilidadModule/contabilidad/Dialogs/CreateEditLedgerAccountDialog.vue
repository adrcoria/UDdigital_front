<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ledgerAccountService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ modelValue: boolean; account: any | null }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

const dialog = computed({
    get: () => props.modelValue,
    set: v => emit("update:modelValue", v),
});

const form = ref({ name: "", description: "", currentBalance: 0 });
const loading = ref(false);

watch(
    () => props.account,
    acc => {
        if (acc) {
            form.value = {
                name: acc.name,
                description: acc.description,
                currentBalance: Number(acc.currentBalance || 0),
            };
        } else {
            form.value = { name: "", description: "", currentBalance: 0 };
        }
    },
    { immediate: true }
);
const save = async () => {
    try {
        loading.value = true;
        if (props.account) {
            await ledgerAccountService.updateAccount(props.account.id, form.value);
            showSuccessAlert("Cuenta actualizada");
        } else {
            await ledgerAccountService.createAccount(form.value);
            showSuccessAlert("Cuenta creada");
        }
        emit("refresh");
        emit("update:modelValue", false);
    } catch {
        showErrorAlert("Error al guardar cuenta");
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <v-dialog v-model="dialog" max-width="450px">
        <v-card>
            <v-card-title>{{ props.account ? "Editar cuenta" : "Nueva cuenta" }}</v-card-title>
            <v-card-text>
                <v-text-field label="Nombre" v-model="form.name" />
                <v-text-field label="Descripción" v-model="form.description" />
                <v-text-field type="number" label="Saldo inicial" v-model.number="form.currentBalance" />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
                <v-btn color="primary" :loading="loading" @click="save">Guardar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
