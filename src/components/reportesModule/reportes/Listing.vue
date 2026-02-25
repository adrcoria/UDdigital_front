<script lang="ts" setup>
import { ref, computed } from "vue";
import { reportService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ filters: any }>();
const exporting = ref(false);

const isReadyToGenerate = computed(() => {
  const f = props.filters;
  if (!f.reportType) return false;
  if (f.reportType === 'DETAIL' || f.reportType === 'SUMMARY_COMPANY') {
    return !!f.dateFrom && !!f.dateTo && !!f.companyId;
  }
  return !!f.dateFrom && !!f.dateTo;
});

const handleExport = async () => {
  try {
    exporting.value = true;
    let res;
    let fileName = "";
    const f = props.filters;

    if (f.reportType === "DETAIL") {
      res = await reportService.exportOperationsExcel({
        startDate: f.dateFrom, endDate: f.dateTo, idAccount: f.accountId,
        idConceptCategory: f.categoryId, idConcept: f.conceptId, idCompany: f.companyId
      });
      fileName = "DETALLE_OPERATIVO";
    } else if (f.reportType === "SUMMARY_COMPANY") {
      res = await reportService.exportOperationsExcelSummary({ 
        startDate: f.dateFrom, endDate: f.dateTo, idCompany: f.companyId 
      });
      fileName = "CONSOLIDADO_ENTIDAD";
    } else {
      res = await reportService.exportOperationsAllExcelSummary({ 
        startDate: f.dateFrom, endDate: f.dateTo 
      });
      fileName = "CONSOLIDADO_GLOBAL_AGRO";
    }

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${fileName}_${f.dateFrom}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    showSuccessAlert("Archivo exportado satisfactoriamente");
  } catch (error) {
    showErrorAlert("Falla en la generación del documento");
  } finally {
    exporting.value = false;
  }
};
</script>

<template>
  <v-card border elevation="0" class="mt-4 rounded-lg overflow-hidden">
    <v-card-text class="pa-10 d-flex align-center justify-space-between bg-blue-grey-lighten-5">
      <div class="d-flex align-center">
        <v-avatar color="white" size="60" class="elevation-1 mr-4">
          <v-icon color="primary" size="30">ph-microsoft-excel-logo</v-icon>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-black text-blue-grey-darken-4">GENERACIÓN DE ARCHIVO</div>
          <div class="text-body-2 text-blue-grey-darken-1">
            El sistema procesará los datos seleccionados para generar un archivo compatible con Microsoft Excel.
          </div>
        </div>
      </div>

      <v-btn 
        :color="filters.reportType === 'DETAIL' ? 'primary' : 'success'" 
        size="x-large"
        variant="flat"
        elevation="4"
        prepend-icon="ph-download-simple" 
        :loading="exporting" 
        :disabled="!isReadyToGenerate"
        @click="handleExport"
        class="px-10 rounded-pill font-weight-black"
      >
        DESCARGAR REPORTE
      </v-btn>
    </v-card-text>
  </v-card>
</template>