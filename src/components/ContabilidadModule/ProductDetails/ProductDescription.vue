<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DictamenDrawer from "@/components/drawers/DictamenDrawer.vue";
import { suscriptionService } from "@/app/http/httpServiceProvider";
import { showErrorAlert, showSuccessAlert } from "@/app/services/alertService";

/* =========================
   ROUTER / STATE
========================= */
const route = useRoute();
const router = useRouter();

const subscriptionUuid = computed(() => (route.params.uuid as string) || "");
const loading = ref(false);
const suscripcion = ref<any>({});
const drawer = ref(false);

/* =========================
   FETCH
========================= */
const getSuscription = async (uuid: string) => {
  if (!uuid) return;
  try {
    loading.value = true;
    const res = await suscriptionService.getSuscription(uuid);
    suscripcion.value = res.data.data;
  } catch {
    showErrorAlert("No se pudo cargar la suscripción.", 53);
  } finally {
    loading.value = false;
  }
};

onMounted(() => getSuscription(subscriptionUuid.value));

watch(
  () => route.params.uuid,
  (n) => typeof n === "string" && n && getSuscription(n)
);

/* =========================
   COMPUTEDS
========================= */
const subscriptionStatus = computed(
  () => suscripcion.value.subscription_status?.name || ""
);

const subscriptionType = computed(
  () => suscripcion.value.subscription_type?.name?.toLowerCase() || ""
);

const activeWorkOrders = computed(() =>
  (suscripcion.value.work_orders || []).filter((o: any) => !o.is_canceled)
);

const handleDictamen = async (payload: any) => {
  try {
    const response = await suscriptionService.createCertificate(payload, suscripcion.value.uuid);
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("Se ha generado la constancia con éxito");
      router.push({ name: "Suscripciones" });
    } else showErrorAlert("(" + response.data.data + ")", 54);
    drawer.value = false;
  } catch (error) {
    console.error("Error al generar constancia:", error);
    showErrorAlert("No se pudo generar la constancia.", 55);
  }
};

const submitRechazo = async (payload: any) => {
  try {
    const response = await suscriptionService.rechazarSolicitud(
      { commnets: payload.comments, delete_motives: payload.delete_motives },
      payload.uuid
    );
    if ([200, 201].includes(response.data.statusCode)) {
      showSuccessAlert("La suscripción ha sido rechazada con éxito");
      router.push({ name: "Suscripciones" });
    } else showErrorAlert("(" + response.data.data + ")", 56);
    drawer.value = false;
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    showErrorAlert("No se pudo rechazar la suscripción.", 57);
  }
};

/* =========================
   DIFERENCIAS
========================= */
const getWorkOrderDifferences = (order: any) => {
  const diffs: any[] = [];
  const sub = suscripcion.value;
  const d = sub.subscription_detail;
  const type = subscriptionType.value;

  if (!d) return diffs;

  if (type === "pecuario") {
    if (d.function?.name !== order.function?.name) {
      diffs.push({
        field: "Función",
        subValue: d.function?.name || "—",
        orderValue: order.function?.name || "—",
      });
    }
    if (d.function?.specie?.name !== order.function?.specie?.name) {
      diffs.push({
        field: "Especie",
        subValue: d.function?.specie?.name || "—",
        orderValue: order.function?.specie?.name || "—",
      });
    }

    if (d.heads_secured !== order.heads_secured) {
      diffs.push({
        field: "Cabezas aseguradas suscripcion vs visita",
        subValue: d.heads_secured ?? "—",
        orderValue: order.heads_secured ?? "—",
      });
    }

    if (

      d.heads_secured !== order.total_heads
    ) {
      diffs.push({
        field: "Total de cabezas en hato",
        subValue: d.heads_secured ?? "—",
        orderValue: order.total_heads ?? "—",
      });
    }


  }

  if (type === "agricola") {
    if (d.crop_type?.name !== order.cropType?.name) {
      diffs.push({
        field: "Tipo de cultivo",
        subValue: d.crop_type?.name || "—",
        orderValue: order.cropType?.name || "—",
      });
    }
    if (d.mode?.name !== order.mode?.name) {
      diffs.push({
        field: "Modalidad",
        subValue: d.mode?.name || "—",
        orderValue: order.mode?.name || "—",
      });
    }
    if (d.agricultural_cycle?.name !== order.agriculturalCycle?.name) {
      diffs.push({
        field: "Ciclo agrícola",
        subValue: d.agricultural_cycle?.name || "—",
        orderValue: order.agriculturalCycle?.name || "—",
      });
    }
    if (
      order.surface_secured != null &&
      d.surface_secured !== order.surface_secured
    ) {
      diffs.push({
        field: "Superficie asegurada (ha)",
        subValue: d.surface_secured ?? "—",
        orderValue: order.surface_secured ?? "—",
      });
    }

    if (
      order.total_surface != null &&
      d.total_surface !== order.total_surface
    ) {
      diffs.push({
        field: "Superficie total (ha)",
        subValue: d.total_surface ?? "—",
        orderValue: order.total_surface ?? "—",
      });
    }

    if (d.sowing_date !== order.sowing_date) {
      diffs.push({
        field: "Fecha de siembra",
        subValue: d.sowing_date ?? "—",
        orderValue: order.sowing_date ?? "—",
      });
    }
  }

  return diffs;
};

/* =========================
   FORMATOS
========================= */
const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});
</script>

<template>
  <Card>
    <v-card-text>
      <v-btn v-if="subscriptionStatus.toLowerCase() === 'devuelta'" color="success" class="mb-4" @click="drawer = true">
        Dictaminar
      </v-btn>

      <!-- ================= ORDENE(S) ================= -->
      <div v-for="order in activeWorkOrders" :key="order.folio" class="mb-6">
        <Card>
          <template #title>
            Orden #{{ order.folio }}
            <v-icon v-if="getWorkOrderDifferences(order).length" color="warning" class="ml-2">
              mdi-alert
            </v-icon>
          </template>

          <v-alert v-if="getWorkOrderDifferences(order).length" type="error" variant="tonal"
            title="Hallazgos en visita de campo" class="mb-4">
            <div v-for="(d, i) in getWorkOrderDifferences(order)" :key="i" class="text-caption">
              <strong>{{ d.field }}:</strong>
              Suscripción → {{ d.subValue }} | Visita → {{ d.orderValue }}
            </div>
          </v-alert>

          <v-card-text>
            <v-container>
              <!-- DATOS ORDEN -->
              <h4>DATOS DE LA VISITA</h4> <br/><br/>

              <v-row no-gutters>
                <v-col cols="5" class="font-weight-bold">Fecha visita</v-col>
                <v-col cols="7">{{ order.visited_date || "—" }}</v-col>
              </v-row>

              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Fecha envío</v-col><v-col cols="7">{{
                order.sender_user_date || "—" }}</v-col></v-row>
              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Fecha esperada</v-col><v-col cols="7">{{
                order.expected_visit_date || "—" }}</v-col></v-row>
              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Envío a oficina</v-col><v-col cols="7">{{
                order.sended_office_date || "—" }}</v-col></v-row>
              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Vencimiento</v-col><v-col cols="7">{{
                order.expiration_date || "—" }}</v-col></v-row>
              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Folio de campo</v-col><v-col cols="7">{{
                order.field_folio || "—" }}</v-col></v-row>

              <v-row no-gutters>
                <v-col cols="5" class="font-weight-bold">Tipo orden</v-col>
                <v-col cols="7">
                  <v-chip>
                    {{ order.work_order_type === "ORDINARY" ? "Ordinaria" : "Extraordinaria" }}
                  </v-chip>
                </v-col>
              </v-row>

              <v-row no-gutters>
                <v-col cols="5" class="font-weight-bold">Observaciones técnico</v-col>
                <v-col cols="7">{{ order.comments || "—" }}</v-col>
              </v-row>

              <!-- TECNICO -->
              <v-divider class="my-3" />
              <h5>Técnico</h5>

              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Nombre</v-col><v-col cols="7">{{
                [order.user?.name,
                order.user?.last_name].filter(Boolean).join(" ") || "—" }}</v-col></v-row>
              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Correo</v-col><v-col cols="7">{{
                order.user?.mail || "—"
              }}</v-col></v-row>
              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Teléfono</v-col><v-col cols="7">{{
                order.user?.phone ||
                "—" }}</v-col></v-row>

              <!-- DATOS TECNICOS -->
              <v-divider class="my-3" />
              <h5>Datos técnicos de campo</h5>

              <!-- PECUARIO -->
              <template v-if="subscriptionType === 'pecuario'">
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Función</v-col><v-col cols="7">{{
                  order.function?.name || "—" }}</v-col></v-row>
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Especie</v-col><v-col cols="7">{{
                  order.function?.specie?.name || "—" }}</v-col></v-row>
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Cabezas en el hato</v-col><v-col cols="7">{{
                  order.total_heads || "—" }}</v-col></v-row>
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Cabezas aseguradas</v-col><v-col cols="7">{{
                  order.heads_secured || "—" }}</v-col></v-row>
              </template>

              <!-- AGRÍCOLA -->
              <template v-else-if="subscriptionType === 'agricola'">
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Cultivo</v-col><v-col cols="7">{{
                  order.cropType?.name || "—" }} ({{ order.cropType?.code || "—" }})</v-col></v-row>
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Modalidad</v-col><v-col cols="7">{{
                  order.mode?.name || "—" }} ({{ order.mode?.code || "—" }})</v-col></v-row>
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Ciclo agrícola</v-col><v-col cols="7">{{
                  order.agriculturalCycle?.name || "—" }} ({{ order.agriculturalCycle?.code || "—" }})</v-col></v-row>
                <v-row no-gutters><v-col cols="5" class="font-weight-bold">Superficie asegurada</v-col><v-col cols="7">{{
                  order.surface_secured || "—" }}</v-col></v-row>
              </template>

              <!-- GEOLOCALIZACION -->
              <v-divider class="my-3" />
              <h5>Geolocalización</h5>

              <v-row no-gutters><v-col cols="5" class="font-weight-bold">Puntos capturados</v-col><v-col cols="7">{{
                order.geolocalizations?.length || 0 }}</v-col></v-row>

              <v-row v-for="(g, idx) in order.geolocalizations || []" :key="idx" no-gutters class="mt-2">
                <v-col cols="5" class="font-weight-bold">Punto {{ idx + 1 }}</v-col>
                <v-col cols="7">Lat: {{ g.lat || "—" }} <br />Lng: {{ g.lng || "—" }}</v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </Card>
      </div>

      <!-- ================= SUSCRIPCIÓN ================= -->
      <v-divider class="my-6" />

      <h4>Datos Generales de la suscripción</h4>
      <v-row no-gutters><v-col cols="5">Folio</v-col><v-col cols="7">{{ suscripcion.folio || "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Constancia</v-col><v-col cols="7">{{ suscripcion.insurance_certificate_number ||
        "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Fecha solicitud</v-col><v-col cols="7">{{ suscripcion.request_date || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Vigencia</v-col><v-col cols="7">{{ suscripcion.validity || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Tipo</v-col><v-col cols="7">{{ suscripcion.subscription_type?.name || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Estado</v-col><v-col cols="7">{{ suscripcion.subscription_status?.name || "—"
      }}</v-col></v-row>

      <v-row no-gutters><v-col cols="5">Dispersor</v-col><v-col cols="7">{{ suscripcion.disburser?.name || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Código dispersor</v-col><v-col cols="7">{{ suscripcion.disburser?.code || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Aseguradora</v-col><v-col cols="7">{{ suscripcion.insurance_company?.name || "—"
      }}</v-col></v-row>

      <v-divider class="my-4" />
      <h4>Detalles de la Suscripción</h4>

      <!-- PECUARIO -->
      <template v-if="subscriptionType === 'pecuario'">
        <v-row no-gutters><v-col cols="5">Función</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.function?.name || "—" }}</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Especie</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.function?.specie?.name || "—" }}</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Cabezas solicitadas</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.heads_requested ?? "—" }}</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Cabezas aseguradas</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.heads_secured ?? "—" }}</v-col></v-row>
      </template>

      <!-- AGRÍCOLA -->
      <template v-else-if="subscriptionType === 'agricola'">
        <v-row no-gutters><v-col cols="5">Tipo de cultivo</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.crop_type?.name || "—" }} ({{
              suscripcion.subscription_detail?.crop_type?.code || "—" }})</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Modalidad</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.mode?.name || "—" }} ({{ suscripcion.subscription_detail?.mode?.code || "—"
            }})</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Ciclo agrícola</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.agricultural_cycle?.name || "—" }} ({{
              suscripcion.subscription_detail?.agricultural_cycle?.code || "—" }})</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Categoría</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.agricultural_cycle?.crop_category || "—" }}</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Superficie solicitada (ha)</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.surface_requested ?? "—" }}</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Superficie asegurada (ha)</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.surface_secured ?? "—" }}</v-col></v-row>
        <v-row no-gutters><v-col cols="5">Fecha de siembra</v-col><v-col cols="7">{{
          suscripcion.subscription_detail?.sowing_date || "—" }}</v-col></v-row>
      </template>

      <v-divider class="my-4" />
      <h4>Datos del productor</h4>
      <v-row no-gutters><v-col cols="5">Nombre</v-col><v-col cols="7">{{ suscripcion.farmer?.name || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">CURP</v-col><v-col cols="7">{{ suscripcion.farmer?.curp || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">RFC</v-col><v-col cols="7">{{ suscripcion.farmer?.rfc || "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Teléfono</v-col><v-col cols="7">{{ suscripcion.farmer?.phone || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Correo</v-col><v-col cols="7">{{ suscripcion.farmer?.mail || "—"
      }}</v-col></v-row>

      <v-divider class="my-2" />
      <h5>Dirección del productor</h5>
      <v-row no-gutters><v-col cols="5">Calle</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.street || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">No. exterior</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.out_number
        || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">No. interior</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.int_number
        || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">CP</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.zip_code || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Colonia</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.neighborhood ||
        "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Localidad</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.locality || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Estado</v-col><v-col cols="7">{{ suscripcion.farmer?.address?.state || "—"
      }}</v-col></v-row>

      <v-divider class="my-4" />
      <h4>Datos del predio</h4>
      <v-row no-gutters><v-col cols="5">Descripción</v-col><v-col cols="7">{{ suscripcion.land?.name || "—"
      }}</v-col></v-row>

      <v-divider class="my-4" />
      <h4>Datos Financieros</h4>
      <v-row no-gutters><v-col cols="5">Monto asegurado</v-col><v-col cols="7">{{ suscripcion.single_amount_secured ?
        currency.format(Number(suscripcion.single_amount_secured)) : "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Prima</v-col><v-col cols="7">{{ suscripcion.single_prima_amount ?
        currency.format(Number(suscripcion.single_prima_amount)) : "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Monto total</v-col><v-col cols="7">{{ suscripcion.total_amount_secured ?? "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Prima total</v-col><v-col cols="7">{{ suscripcion.total_prima_amount ?? "—"
      }}</v-col></v-row>

      <v-row no-gutters><v-col cols="5">Reaseguro acumulado</v-col><v-col cols="7">{{
        suscripcion.reinsurance_accumulated ??
        "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Gastos de operación</v-col><v-col cols="7">{{ suscripcion.operation_expenses ??
        "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Reserva de riesgo</v-col><v-col cols="7">{{ suscripcion.risk_reserve ?? "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Gastos de viaje acumulados</v-col><v-col cols="7">{{
        suscripcion.accumulated_travel_expenses ?? "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Gastos de oficina acumulados</v-col><v-col cols="7">{{
        suscripcion.accumulated_office_expenses ?? "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Gastos de responsabilidad</v-col><v-col cols="7">{{
        suscripcion.responsability_expenses ?? "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Nómina acumulada</v-col><v-col cols="7">{{ suscripcion.accumulated_payroll ??
        "—"
      }}</v-col></v-row>

      <v-divider class="my-4" />
      <h4>Información Adicional</h4>
      <v-row no-gutters><v-col cols="5">Concepto</v-col><v-col cols="7">{{ suscripcion.concept || "—" }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Endosos</v-col><v-col cols="7">{{ suscripcion.endorsements || "—"
      }}</v-col></v-row>
      <v-row no-gutters><v-col cols="5">Observaciones</v-col><v-col cols="7">{{ suscripcion.observations || "—"
      }}</v-col></v-row>
    </v-card-text>
  </Card>

  <DictamenDrawer v-if="drawer" :visible="drawer" :subscription="suscripcion" @update:visible="drawer = $event"
    @submit-dictamen="handleDictamen" @submit-rechazo="submitRechazo" />
</template>
