<script lang="ts" setup>
defineProps<{
  widgets: {
    title: string;
    countTo: number;
    ratio: string;
    isSuccess: boolean;
    chart: { series: any[]; chartOptions: any };
    suffix?: string;
  }[];
}>();
</script>

<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="6"
      lg="3"
      v-for="(widget, index) in widgets"
      :key="'widget-' + index"
    >
      <v-card height="168">
        <!-- 🔹 Título del widget -->
        <v-card-title class="pb-0">
          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-2 text-muted">{{ widget.title }}</span>
          </div>
        </v-card-title>

        <!-- 🔹 Contenido del widget -->
        <v-card-text class="py-0">
          <v-row no-gutters>
            <!-- Número principal -->
            <v-col cols="12" lg="5" class="d-flex flex-column">
              <CountTo
                :endVal="widget.countTo"
                :suffix="widget.suffix"
                :decimals="0"
                class="text-h5 font-weight-bold mt-auto"
              />
              <div
                class="d-flex align-center mt-auto"
                :class="widget.isSuccess ? 'text-success' : 'text-danger'"
              >
                <i v-if="widget.isSuccess" class="ph-arrow-up me-1"></i>
                <i v-else class="ph-arrow-down me-1"></i>
                {{ widget.ratio }}
              </div>
            </v-col>

            <!-- Gráfica mini (opcional) -->
            <v-col cols="12" lg="7">
              <apexchart
                v-if="widget.chart"
                class="apex-charts"
                height="110"
                dir="ltr"
                :series="widget.chart.series"
                :options="widget.chart.chartOptions"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
