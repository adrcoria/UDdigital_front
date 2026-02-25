<script lang="ts" setup>
import { ref, computed } from "vue";
import { reportService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const props = defineProps<{ filters: any }>();
const exporting = ref(false);

/* ------------------------------------------------------
 * LÓGICA DE VALIDACIÓN (REGLAS VALLADOLID)
 * ------------------------------------------------------ */
const isReadyToGenerate = computed(() => {
  const f = props.filters;
  
  // 0. Si no hay tipo de reporte, nadie pasa
  if (!f.reportType) return false;

  // 1. Detalle de operaciones: Solo requiere fechas (Compañía opcional)
  if (f.reportType === 'DETAIL') {
    return !!f.dateFrom && !!f.dateTo;
  }

  // 2. Consolidado por empresa: Obliga fechas y Compañía forzosamente
  if (f.reportType === 'SUMMARY_COMPANY') {
    return !!f.dateFrom && !!f.dateTo && !!f.companyId;
  }

  // 3. Consolidado agroindustrias: Solo requiere rango de fechas
  if (f.reportType === 'SUMMARY_ALL') {
    return !!f.dateFrom && !!f.dateTo;
  }

  return false;
});

/* ------------------------------------------------------
 * PROCESAMIENTO DE EXPORTACIÓN
 * ------------------------------------------------------ */
const handleExport = async () => {
  try {
    exporting.value = true;
    let res;
    let fileName = "";
    const f = props.filters;

    // Configuración de parámetros según el endpoint correspondiente
    if (f.reportType === "DETAIL") {
      res = await reportService.exportOperationsExcel({
        startDate: f.dateFrom, 
        endDate: f.dateTo, 
        idAccount: f.accountId || undefined,
        idConceptCategory: f.categoryId || undefined, 
        idConcept: f.conceptId || undefined, 
        idCompany: f.companyId || undefined
      });
      fileName = "DETALLE_OPERATIVO";
    } else if (f.reportType === "SUMMARY_COMPANY") {
      res = await reportService.exportOperationsExcelSummary({ 
        startDate: f.dateFrom, 
        endDate: f.dateTo, 
        idCompany: f.companyId 
      });
      fileName = "CONSOLIDADO_ENTIDAD";
    } else {
      res = await reportService.exportOperationsAllExcelSummary({ 
        startDate: f.dateFrom, 
        endDate: f.dateTo 
      });
      fileName = "CONSOLIDADO_GLOBAL_AGRO";
    }

    // Generación del archivo para descarga
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${fileName}_${f.dateFrom}_al_${f.dateTo}.xlsx`);
    document.body.appendChild(link);
    link.click();
    
    // Limpieza de memoria
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showSuccessAlert("Archivo maestro generado satisfactoriamente");
  } catch (error) {
    showErrorAlert("Falla en la comunicación con el servidor de reportes");
  } finally {
    exporting.value = false;
  }
};
</script>

<template>
  <v-card border elevation="0" class="mt-5 rounded-lg overflow-hidden">
    <v-card-text class="pa-10 d-flex align-center justify-space-between bg-blue-grey-lighten-5">
      
      <div class="d-flex align-center">
        <v-avatar color="white" size="70" class="elevation-2 mr-6">
          <v-icon color="primary" size="35">ph-microsoft-excel-logo</v-icon>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-black text-blue-grey-darken-4 text-uppercase tracking-tight">
            Generación de Archivo Maestro
          </div>
          <div class="text-body-2 text-blue-grey-darken-2 mt-1">
            El sistema procesará los metadatos filtrados para consolidar un archivo compatible con Microsoft Excel.
          </div>
        </div>
      </div>

      <div class="text-center">
        <v-btn 
          :color="filters.reportType === 'DETAIL' ? 'primary' : 'success'" 
          size="x-large"
          variant="flat"
          elevation="4"
          prepend-icon="ph-download-simple" 
          :loading="exporting" 
          :disabled="!isReadyToGenerate"
          @click="handleExport"
          class="px-12 rounded-pill font-weight-black"
        >
          DESCARGAR REPORTE
        </v-btn>
        
        <div v-if="!isReadyToGenerate && filters.reportType" class="text-caption text-error mt-2 font-weight-bold">
          * Complete los campos obligatorios para habilitar la descarga
        </div>
      </div>

    </v-card-text>
  </v-card>
</template>

<style scoped>
.tracking-tight {
  letter-spacing: -0.02em;
}
.rounded-pill {
  border-radius: 50px !important;
}
</style>