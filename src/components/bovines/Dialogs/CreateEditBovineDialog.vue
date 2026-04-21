<script lang="ts" setup>
import { ref, watch, computed, nextTick } from "vue";
import { bovineService, liveStockService, parameterService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import { localDateStr } from "@/app/utils/date";

const props = defineProps<{ modelValue: boolean; item: any | null; initialValues?: Record<string, any>; isCria?: boolean }>();
const emit = defineEmits(["update:modelValue", "refresh"]);

/* ------------------ State ------------------ */
const dialog = ref(false);
const loading = ref(false);
const loadingCatalogs = ref(false);
const formRef = ref(null);
const isEditing = ref(false); // Flag para el Overlay de preparación
const today = computed(() => localDateStr());

const factorVenta = ref(0);

const lists = ref<any>({
    sex: [], races: [], types: [], purposes: [], origins: [], owners: [], deathCauses: []
});

const reproductiveStatusOptions = computed(() => {
    if (!form.value.sexId) return [];
    const selectedSex = lists.value.sex.find((s: any) => s.id === form.value.sexId);
    const sexName = selectedSex?.name?.toUpperCase();
    if (sexName === 'MACHO') {
        return [
            { value: 'Descanso', title: 'Descanso' },
            { value: 'Empadre', title: 'Empadre' },
            { value: 'Donador', title: 'Donador' },
        ];
    }
    if (sexName === 'HEMBRA') {
        return [
            { value: 'Preñada', title: 'Preñada' },
            { value: 'Vacia', title: 'Vacia' },
        ];
    }
    return [];
});

const listMales = ref<any[]>([]);
const listFemales = ref<any[]>([]);

const form = ref<any>({
    siniigaEarTag: "",
    internalEarTag: "",
    birthDate: "",
    name: "",
    notes: "",
    dateAddedToHerd: "",
    daysOpen: 1,
    birthWeight: 0,
    saleValue: 0,
    purchaseValue: 0,
    netWeight: 0,
    gdpTotal: 0.8,
    sexId: null,
    bovineOriginId: null,
    bovineTypeId: null,
    bovinePurposeId: null,
    livestockOwnerId: null,
    fatherId: null,
    motherId: null,
    bovineStatus: "VIVO",
    deathDate: "",
    deathCauseId: null,
    deathComments: "",
    reproductiveStatus: null,
    raceAssignments: []
});

const selectedRaces = ref<any[]>([{ raceId: null, percentage: 100, order: 1 }]);

/* ------------------ Funciones de Soporte ------------------ */
const getAvailableRaces = (currentIndex: number) => {
    const selectedIds = selectedRaces.value
        .filter((_, index) => index !== currentIndex)
        .map(r => r.raceId);
    return lists.value.races.filter((race: any) => !selectedIds.includes(race.id));
};

const resetForm = () => {
    form.value = {
        siniigaEarTag: "", internalEarTag: "", name: "", birthDate: "",
        notes: "", dateAddedToHerd: "", daysOpen: 1, birthWeight: 0,
        saleValue: 0, purchaseValue: 0, netWeight: 0, gdpTotal: 0.8,
        sexId: null, bovineOriginId: null, bovineTypeId: null, bovinePurposeId: null,
        livestockOwnerId: null, fatherId: null, motherId: null,
        bovineStatus: "VIVO", deathDate: "", deathCauseId: null, deathComments: "",
        reproductiveStatus: null
    };
    selectedRaces.value = [{ raceId: null, percentage: 100, order: 1 }];
};

const onChangePrecio = () => {
    form.value.netWeight = Number(form.value.birthWeight || 0) + Number(form.value.gdpTotal || 0);
    form.value.saleValue = form.value.netWeight * (factorVenta.value || 0);
};

/* ------------------ Computed: Filtros ------------------ */
const ageInMonths = computed(() => {
    if (!form.value.birthDate) return null;
    const birth = new Date(form.value.birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return Math.max(0, months);
});

const filteredTypes = computed(() => {
    if (!form.value.sexId) return [];
    const bySex = lists.value.types.filter((t: any) => t.sex?.id === form.value.sexId);

    if (props.isCria) {
        return bySex.filter((t: any) => ['BECERRO', 'BECERRA'].includes(t.name?.toUpperCase()));
    }

    if (ageInMonths.value === null) return bySex;

    // Ordenar por months ascendente y buscar el primer umbral que cubra la edad
    const sorted = [...bySex].sort((a: any, b: any) => a.months - b.months);
    const age = ageInMonths.value;
    const match = sorted.find((t: any) => age <= t.months);
    // Si supera todos los umbrales, aplica el último (ej. SEMENTAL)
    return [match ?? sorted[sorted.length - 1]];
});

// Etapa reproductiva: el tipo seleccionado tiene months >= 37 (VACA, TORO, SEMENTAL)
const isReproductiveAge = computed(() => {
    if (!form.value.bovineTypeId || !lists.value.types.length) return false;
    const selectedType = lists.value.types.find((t: any) => t.id === form.value.bovineTypeId);
    return selectedType ? selectedType.months >= 37 : false;
});

const filteredPurposes = computed(() => lists.value.purposes);

const isCompra = computed(() => {
    if (!form.value.bovineOriginId || !lists.value.origins.length) return false;
    const origin = lists.value.origins.find((o: any) => o.id === form.value.bovineOriginId);
    return origin?.name.toUpperCase().trim() === 'COMPRA';
});

const isHato = computed(() => {
    if (!form.value.bovineOriginId || !lists.value.origins.length) return false;
    const origin = lists.value.origins.find((o: any) => o.id === form.value.bovineOriginId);
    return origin?.name.toUpperCase().includes('HATO');
});

/* ------------------ Validaciones ------------------ */
const rules = {
    required: (v: any) => !!v || "Este campo es obligatorio",
    noFuture: (v: any) => !v || v <= today.value || "No se permiten fechas futuras",
    purchaseRequired: (v: any) => {
        const origin = lists.value.origins.find((o: any) => o.id === form.value.bovineOriginId);
        if (origin?.name.toUpperCase() === 'COMPRA') return !!v || "El valor de compra es obligatorio";
        return true;
    },
    exact12: (v: any) => (v && v.length === 12) || "Debe tener exactamente 12 dígitos",
    only12Digits: (v: any) => /^\d{12}$/.test(v) || "Deben ser exactamente 12 números",
    purposeRestriction: () => true
};

/* ------------------ Logic: Watchers ------------------ */
watch(() => form.value.birthWeight, () => onChangePrecio());

watch(() => form.value.birthDate, () => {
    if (isEditing.value || !form.value.sexId) return;
    const options = filteredTypes.value;
    if (!options.find((t: any) => t.id === form.value.bovineTypeId)) {
        form.value.bovineTypeId = null;
    }
    if (options.length === 1) {
        form.value.bovineTypeId = options[0].id;
    }
});

// Cuando cambia la etapa de vida: si no es reproductiva, asignar "Vacia" y ocultar el campo
watch(isReproductiveAge, (reproductive) => {
    if (isEditing.value) return;
    if (!reproductive) {
        form.value.reproductiveStatus = 'Vacia';
    } else {
        form.value.reproductiveStatus = null;
    }
});

watch(() => form.value.bovineOriginId, (newId) => {
    if (isEditing.value) return;
    const origin = lists.value.origins.find((o: any) => o.id === newId);
    const originName = origin?.name.toUpperCase() || "";
    if (originName !== 'COMPRA') form.value.purchaseValue = 0;
    if (!originName.includes('HATO')) {
        form.value.fatherId = null;
        form.value.motherId = null;
    }
});

watch(() => form.value.bovineStatus, (newStatus) => {
    if (isEditing.value) return;
    if (newStatus === 'VIVO') {
        form.value.deathDate = "";
        form.value.deathCauseId = null;
        form.value.deathComments = "";
    }
});

const onSexChange = () => {
    form.value.bovinePurposeId = null;
    form.value.reproductiveStatus = null;
    if (props.isCria) {
        const selectedSex = lists.value.sex.find((s: any) => s.id === form.value.sexId);
        const sexName = selectedSex?.name?.toUpperCase();
        const criaTypeName = sexName === 'MACHO' ? 'BECERRO' : sexName === 'HEMBRA' ? 'BECERRA' : null;
        const criaType = criaTypeName
            ? lists.value.types.find((t: any) => t.name?.toUpperCase() === criaTypeName)
            : null;
        form.value.bovineTypeId = criaType?.id ?? null;
    } else {
        form.value.bovineTypeId = null;
        // Auto-seleccionar si birthDate ya está capturada y hay un único resultado
        nextTick(() => {
            if (form.value.birthDate && filteredTypes.value.length === 1) {
                form.value.bovineTypeId = filteredTypes.value[0].id;
            }
        });
    }
};

/* ------------------ Data Loading ------------------ */
const loadData = async () => {
    try {
        loadingCatalogs.value = true;
        const fetchSafe = async (slug: string) => {
            try {
                const res = await liveStockService.getItems(slug, { page: 1, limit: 1000 });
                return res.data?.data || [];
            } catch (e) { return []; }
        };

        const [sex, race, type, purpose, origin, owner, death, resParams] = await Promise.all([
            fetchSafe("sex"), fetchSafe("bovine-race"), fetchSafe("bovine-type"),
            fetchSafe("bovine-purpose"), fetchSafe("bovine-origin"),
            fetchSafe("livestock-owner"), fetchSafe("death-cause"),
            parameterService.getParameters()
        ]);

        const paramsList = resParams.data?.data || [];
        const factorParam = paramsList.find((p: any) => p.name === 'Factor Venta');
        factorVenta.value = factorParam ? Number(factorParam.value) : 8;

        lists.value = { sex, races: race, types: type, purposes: purpose, origins: origin, owners: owner, deathCauses: death };

        const maleId = sex.find((s: any) => s.name.toUpperCase() === 'MACHO')?.id;
        const femaleId = sex.find((s: any) => s.name.toUpperCase() === 'HEMBRA')?.id;
        if (maleId) {
            const resM = await bovineService.getBovinesBySex(maleId);
            listMales.value = resM.data?.data || [];
        }
        if (femaleId) {
            const resF = await bovineService.getBovinesBySex(femaleId);
            listFemales.value = resF.data?.data || [];
        }
    } finally {
        loadingCatalogs.value = false;
    }
};

/* ------------------ Watcher Principal (Open Dialog) ------------------ */
watch(() => props.modelValue, async (val) => {
    dialog.value = val;
    if (val) {
        isEditing.value = true; // Activa el overlay de preparación
        loadingCatalogs.value = true;

        try {
            await loadData();

            if (props.item?.id) {
                const response = await bovineService.getBovineById(props.item.id);
                const serverItem = response.data?.data;

                form.value = {
                    ...form.value,
                    ...serverItem,
                    sexId: serverItem.sex?.id || serverItem.sexId,
                    bovineOriginId: serverItem.bovineOrigin?.id || serverItem.bovineOriginId,
                    bovineTypeId: serverItem.bovineType?.id || serverItem.bovineTypeId,
                    bovinePurposeId: serverItem.bovinePurpose?.id || serverItem.bovinePurposeId,
                    livestockOwnerId: serverItem.livestockOwner?.id || serverItem.livestockOwnerId,
                    fatherId: serverItem.father?.id || serverItem.fatherId,
                    motherId: serverItem.mother?.id || serverItem.motherId,
                    deathCauseId: serverItem.deathCause?.id || serverItem.deathCauseId,
                    reproductiveStatus: serverItem.reproductiveStatus || null
                };

                if (serverItem.raceAssignments?.length) {
                    selectedRaces.value = serverItem.raceAssignments.map((r: any) => ({
                        raceId: r.bovineRace?.id || r.raceId,
                        percentage: parseInt(r.percentage),
                        order: r.order
                    }));
                } else {
                    selectedRaces.value = [{ raceId: null, percentage: 100, order: 1 }];
                }

                onChangePrecio();
            } else {
                resetForm();
                if (props.initialValues) {
                    Object.assign(form.value, props.initialValues);

                    // Precargar razas desde padre y madre si no vienen explícitas
                    if (!props.initialValues.raceAssignments?.length && (props.initialValues.fatherId || props.initialValues.motherId)) {
                        const fetches = await Promise.allSettled([
                            props.initialValues.fatherId ? bovineService.getBovineById(props.initialValues.fatherId) : Promise.resolve(null),
                            props.initialValues.motherId ? bovineService.getBovineById(props.initialValues.motherId) : Promise.resolve(null),
                        ]);

                        const fatherRaces: any[] = fetches[0].status === 'fulfilled' && fetches[0].value
                            ? (fetches[0].value.data?.data?.raceAssignments || []) : [];
                        const motherRaces: any[] = fetches[1].status === 'fulfilled' && fetches[1].value
                            ? (fetches[1].value.data?.data?.raceAssignments || []) : [];

                        // Cada progenitor aporta 50%; ese 50% se divide equitativamente entre sus razas
                        const combined: any[] = [];
                        const fatherShare = fatherRaces.length ? 50 / fatherRaces.length : 0;
                        const motherShare = motherRaces.length ? 50 / motherRaces.length : 0;

                        fatherRaces.forEach((r: any) => combined.push({
                            raceId: r.bovineRace?.id || r.raceId,
                            percentage: Math.round(fatherShare),
                            order: combined.length + 1
                        }));
                        motherRaces.forEach((r: any) => combined.push({
                            raceId: r.bovineRace?.id || r.raceId,
                            percentage: Math.round(motherShare),
                            order: combined.length + 1
                        }));

                        if (combined.length) selectedRaces.value = combined;
                    } else if (props.initialValues.raceAssignments?.length) {
                        selectedRaces.value = props.initialValues.raceAssignments.map((r: any, i: number) => ({
                            raceId: r.bovineRace?.id || r.raceId,
                            percentage: Number(r.percentage),
                            order: i + 1
                        }));
                    }
                }
                if (props.isCria) {
                    const hatoOrigin = lists.value.origins.find(
                        (o: any) => o.name?.toUpperCase().includes('HATO')
                    );
                    if (hatoOrigin) form.value.bovineOriginId = hatoOrigin.id;
                }
            }
        } catch (error) {
            showErrorAlert("Error al cargar datos del servidor");
        } finally {
            loadingCatalogs.value = false;
            await nextTick();
            isEditing.value = false; // Quita el overlay
        }
    }
}, { immediate: true });

watch(dialog, (v) => emit("update:modelValue", v));

const totalPercentage = computed(() => selectedRaces.value.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0));

/* ------------------ Método Save (Limpieza de Payload) ------------------ */
const save = async () => {
    const { valid } = await (formRef.value as any).validate();
    if (!valid) return showErrorAlert("Por favor, completa los campos requeridos correctamente.");
    if (totalPercentage.value !== 100) return showErrorAlert("La composición racial debe sumar el 100%.");

    try {
        loading.value = true;

        // CONSTRUCCIÓN DEL PAYLOAD LIMPIO (Evita error 400 por objetos anidados)
        const finalPayload = {
            siniigaEarTag: form.value.siniigaEarTag,
            internalEarTag: form.value.internalEarTag,
            birthDate: form.value.birthDate,
            name: form.value.name,
            notes: form.value.notes,
            dateAddedToHerd: form.value.dateAddedToHerd,
            daysOpen: Number(form.value.daysOpen),
            birthWeight: Number(form.value.birthWeight),
            saleValue: Number(form.value.saleValue),
            purchaseValue: Number(form.value.purchaseValue),
            netWeight: Number(form.value.netWeight),
            sexId: form.value.sexId,
            bovineOriginId: form.value.bovineOriginId,
            bovineTypeId: form.value.bovineTypeId,
            bovinePurposeId: form.value.bovinePurposeId,
            livestockOwnerId: form.value.livestockOwnerId,
            fatherId: form.value.fatherId,
            motherId: form.value.motherId,
            bovineStatus: form.value.bovineStatus,
            deathDate: form.value.deathDate,
            deathCauseId: form.value.deathCauseId,
            deathComments: form.value.deathComments,
            reproductiveStatus: form.value.reproductiveStatus,
            raceAssignments: selectedRaces.value.map((r, i) => ({
                raceId: r.raceId,
                percentage: Number(r.percentage),
                order: i + 1
            }))
        };

        if (props.item?.id) {
            await bovineService.updateBovine(props.item.id, finalPayload);
            showSuccessAlert("Bovino actualizado");
            emit("refresh", null);
        } else {
            const res = await bovineService.createBovine(finalPayload);
            showSuccessAlert("Bovino registrado");
            emit("refresh", res.data?.data?.id ?? null);
        }
        dialog.value = false;
    } catch (error: any) {
        const serverResponse = error.response?.data;
        
        if (serverResponse && Array.isArray(serverResponse.message)) {
            // 2. Mapeamos los errores para obtener solo los textos de las constraints
            // Como cada objeto tiene un sub-objeto 'constraints', extraemos sus valores
            const validationErrors = serverResponse.message.map((err: any) => {
                return Object.values(err.constraints).join(", ");
            });

            // 3. Mostramos los errores. Puedes unirlos con un salto de línea o mostrar el primero
            showErrorAlert(validationErrors.join(" | "));
        } else {
            // 4. Error genérico si la estructura no es la esperada
            const msg = serverResponse?.message || error.message || "Error al procesar la solicitud";
            showErrorAlert(Array.isArray(msg) ? msg[0] : msg);
        }
    } finally {
        loading.value = false;
    }
};

const addRace = () => selectedRaces.value.push({ raceId: null, percentage: 0, order: selectedRaces.value.length + 1 });
const removeRace = (index: number) => selectedRaces.value.splice(index, 1);
</script>

<template>
    <v-dialog v-model="dialog" max-width="1000px" scrollable persistent>
        <v-card v-if="dialog">

            <v-overlay v-model="isEditing" contained class="align-center justify-center" persistent scrim="white">
                <div class="text-center">
                    <v-progress-circular indeterminate color="primary" size="64" width="6" class="mb-4" />
                    <div class="text-h6 text-primary font-weight-bold">Preparando formulario...</div>
                    <div class="text-caption text-grey">Sincronizando datos con el servidor</div>
                </div>
            </v-overlay>

            <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
                <v-icon icon="ph-cow" class="mr-2" />
                <span class="text-h6 font-weight-bold">{{ item ? 'Editar' : 'Registrar' }} Bovino</span>
                <v-spacer />
                <v-btn icon="ph-x" variant="text" color="white" @click="dialog = false" />
            </v-card-title>

            <v-card-text class="pa-6" :style="{ visibility: isEditing ? 'hidden' : 'visible' }">
                <v-form ref="formRef">
                    <v-row dense>
                        <v-col cols="12" md="4"><v-text-field label="Arete Siniiga *" v-model="form.siniigaEarTag"
                                :rules="[rules.required, rules.exact12]" variant="outlined"
                                :readonly="!!item?.id" :bg-color="item?.id ? 'grey-lighten-4' : undefined" /></v-col>
                        <v-col cols="12" md="4"><v-text-field label="Arete Interno *" v-model="form.internalEarTag"
                                :rules="[rules.required, rules.exact12]" variant="outlined"
                                :readonly="!!item?.id" :bg-color="item?.id ? 'grey-lighten-4' : undefined" /></v-col>
                        <v-col cols="12" md="4"><v-text-field label="Nombre / Apodo *" v-model="form.name"
                                :rules="[rules.required]" variant="outlined" /></v-col>

                        <v-col cols="12" md="3"><v-text-field label="Peso Inicial (kg) *" type="number"
                                v-model.number="form.birthWeight" :rules="[rules.required]"
                                variant="outlined" /></v-col>
                        <v-col style="display: none;" cols="12" md="3"><v-text-field label="GDP" v-model="form.gdpTotal"
                                variant="outlined" readonly bg-color="grey-lighten-4" /></v-col>
                        <v-col cols="12" md="3"><v-text-field label="Peso Neto" v-model="form.netWeight"
                                variant="outlined" readonly suffix="KG" bg-color="grey-lighten-4" /></v-col>
                        <v-col cols="12" md="6">
                            <v-text-field :label="`Valor Venta (Factor: ${factorVenta})`" v-model="form.saleValue"
                                variant="outlined" readonly prefix="$" bg-color="grey-lighten-4" />
                        </v-col>

                        <v-col cols="12" md="6"><v-text-field label="Fecha Nac. *" type="date" v-model="form.birthDate"
                                :rules="[rules.required, rules.noFuture]" :max="today" variant="outlined"
                                :readonly="isCria && !!props.initialValues?.birthDate"
                                :bg-color="isCria && !!props.initialValues?.birthDate ? 'grey-lighten-4' : undefined" /></v-col>
                        <v-col cols="12" md="6"><v-text-field label="Fecha Ingreso Hato *" type="date"
                                v-model="form.dateAddedToHerd" :rules="[rules.required, rules.noFuture]" :max="today"
                                variant="outlined" /></v-col>

                        <v-col cols="12" md="3"><v-autocomplete label="Sexo *" v-model="form.sexId" :items="lists.sex"
                                item-title="name" item-value="id" :rules="[rules.required]" variant="outlined"
                                @update:model-value="onSexChange" /></v-col>
                        <v-col cols="12" md="3"><v-autocomplete label="Etapa de vida *" v-model="form.bovineTypeId"
                                :items="filteredTypes" item-title="name" item-value="id" :rules="[rules.required]"
                                :disabled="!form.sexId" variant="outlined" /></v-col>
                        <v-col cols="12" md="3"><v-autocomplete label="Propósito *" v-model="form.bovinePurposeId"
                                :items="filteredPurposes" item-title="name" item-value="id"
                                :rules="[rules.required]"
                                variant="outlined" /></v-col>
                        <v-col cols="12" md="3"><v-autocomplete label="Origen *" v-model="form.bovineOriginId"
                                :items="lists.origins" item-title="name" item-value="id" :rules="[rules.required]"
                                variant="outlined" :disabled="isCria" /></v-col>

                        <v-col cols="12" md="4" v-if="isReproductiveAge">
                            <v-select label="Estatus Reproductivo *" v-model="form.reproductiveStatus"
                                :items="reproductiveStatusOptions" item-title="title" item-value="value"
                                variant="outlined" :rules="[rules.required]" />
                        </v-col>
                        <v-col cols="12" :md="form.sexId ? 8 : 12"><v-autocomplete label="Propietario *" v-model="form.livestockOwnerId"
                                :items="lists.owners" :item-title="(i: any) => `${i.firstName} ${i.lastName}`" item-value="id"
                                :rules="[rules.required]" variant="outlined" /></v-col>

                        <v-col cols="12" v-if="isCompra">
                            <v-text-field label="Valor de Compra *" type="number" v-model.number="form.purchaseValue"
                                :rules="[rules.purchaseRequired]" variant="outlined" prefix="$" color="success" />
                        </v-col>

                        <v-col cols="12" v-if="isHato">
                            <v-row dense>
                                <v-col cols="12" md="6">
                                    <v-autocomplete label="Padre" v-model="form.fatherId"
                                        :items="listMales"
                                        :item-title="(b: any) => `${b.name} (${b.internalEarTag})`"
                                        item-value="id" variant="outlined"
                                        :clearable="!props.initialValues?.fatherId"
                                        :readonly="!!props.initialValues?.fatherId"
                                        :bg-color="props.initialValues?.fatherId ? 'grey-lighten-4' : undefined">
                                        <template #item="{ props: p, item }">
                                            <v-list-item v-bind="p"
                                                :title="item.raw.name"
                                                :subtitle="`Arete: ${item.raw.internalEarTag}`" />
                                        </template>
                                        <template #selection="{ item }">
                                            {{ item.raw.name }} — {{ item.raw.internalEarTag }}
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-autocomplete label="Madre" v-model="form.motherId"
                                        :items="listFemales"
                                        :item-title="(b: any) => `${b.name} (${b.internalEarTag})`"
                                        item-value="id" variant="outlined"
                                        :clearable="!props.initialValues?.motherId"
                                        :readonly="!!props.initialValues?.motherId"
                                        :bg-color="props.initialValues?.motherId ? 'grey-lighten-4' : undefined"
                                        :disabled="isCria && !props.initialValues?.motherId">
                                        <template #item="{ props: p, item }">
                                            <v-list-item v-bind="p"
                                                :title="item.raw.name"
                                                :subtitle="`Arete: ${item.raw.internalEarTag}`" />
                                        </template>
                                        <template #selection="{ item }">
                                            {{ item.raw.name }} — {{ item.raw.internalEarTag }}
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                            </v-row>
                        </v-col>

                        <v-col cols="12" v-if="!item?.id"><v-divider class="my-3" />Estatus y Defunción</v-col>
                        <v-col v-if="!item?.id" cols="12" :md="form.bovineStatus === 'MUERTO' ? 6 : 12"><v-autocomplete
                                label="Estatus Actual" v-model="form.bovineStatus" :items="['VIVO', 'MUERTO']"
                                variant="outlined" /></v-col>
                        <v-col cols="12" md="6" v-if="!item?.id && form.bovineStatus === 'MUERTO'"><v-text-field
                                label="Fecha Defunción *" type="date" v-model="form.deathDate"
                                :rules="[rules.required, rules.noFuture]" :max="today" variant="outlined" /></v-col>
                        <v-col cols="12" md="6" v-if="!item?.id && form.bovineStatus === 'MUERTO'"><v-autocomplete
                                label="Causa de Muerte *" v-model="form.deathCauseId" :items="lists.deathCauses"
                                item-title="name" item-value="id" :rules="[rules.required]" variant="outlined" /></v-col>
                        <v-col cols="12" md="6" v-if="!item?.id && form.bovineStatus === 'MUERTO'"><v-text-field
                                label="Comentarios de muerte*" v-model="form.deathComments"
                                :rules="[rules.required]" variant="outlined" /></v-col>

                        <v-col cols="12">
                            <v-divider class="my-3" />
                            <div class="d-flex justify-space-between align-center mb-2">
                                <span class="text-subtitle-2 font-weight-bold">Composición Racial (%)</span>
                                <v-btn size="small" color="secondary" variant="flat" @click="addRace"
                                    :disabled="totalPercentage >= 100">+
                                    Añadir Raza</v-btn>
                            </div>
                            <v-row v-for="(race, index) in selectedRaces" :key="index" dense align="center">
                                <v-col cols="7">
                                    <v-autocomplete label="Raza" v-model="race.raceId" :items="getAvailableRaces(index)"
                                        item-title="name" item-value="id" variant="outlined" density="comfortable"
                                        :rules="[rules.required]" :loading="loadingCatalogs" />
                                </v-col>
                                <v-col cols="3">
                                    <v-text-field label="%" v-model.number="race.percentage" type="number"
                                        variant="outlined" density="comfortable" :rules="[rules.required]" />
                                </v-col>
                                <v-col cols="2">
                                    <v-btn icon="ph-trash" variant="text" color="error" @click="removeRace(index)"
                                        v-if="selectedRaces.length > 1" />
                                </v-col>
                            </v-row>
                        </v-col>

                        <v-col cols="12">
                            <v-textarea label="Notas y Observaciones" v-model="form.notes" variant="outlined" rows="3"
                                auto-grow />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider />
            <v-card-actions class="pa-4 bg-grey-lighten-4" v-if="!isEditing">
                <v-spacer />
                <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
                <v-btn color="primary" @click="save" :loading="loading" class="px-6">Guardar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>