<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { getChartColorsArray } from "@/app/common/chartColorArray";
import { getCharts } from "@/components/dashboard/crm/utils";
import { useLayoutStore } from "@/store/app";

const state = useLayoutStore();
const layoutTheme = computed(() => state.layoutTheme);

const charts = ref<any>(getCharts(getChartColorsArray));
const balanceOverviewChart = ref(charts.value.balanceOverviewChart);
const overviewType = ref(3);
const btnList = ref(["ALL", "1M", "6M", "1Y"]);
const overviewList = ref([
  {
    title: "Total Revenue",
    price: "$795.69k",
    percent: "6.19%",
    isSuccess: true,
    color: "primary",
  },
  {
    title: "Total Expenses",
    price: "$415.37k",
    percent: "3.62%",
    isSuccess: true,
    color: "light",
  },
  {
    title: "Profit Ratio",
    price: "3.6%",
    percent: "1.47%",
    isSuccess: false,
    color: "dark",
  },
]);

watch(layoutTheme, () => {
  balanceOverviewChart.value = null;
  setTimeout(() => {
    const chartsVal = getCharts(getChartColorsArray);
    balanceOverviewChart.value = chartsVal.balanceOverviewChart;
  }, 200);
});
</script>
<template>
  <Card title="Balance Overview" class="h-100">
    <template #title-action>
      <v-btn-toggle
        v-model="overviewType"
        color="primary"
        variant="tonal"
        height="27"
      >
        <v-btn
          size="x-small"
          class="me-1"
          height="27"
          rounded
          v-for="btn in btnList"
          :key="btn"
        >
          {{ btn }}
        </v-btn>
      </v-btn-toggle>
    </template>
    <v-card-text>
      <apexchart
        v-if="balanceOverviewChart"
        class="apex-charts"
        height="270"
        dir="ltr"
        :series="balanceOverviewChart.series"
        :options="balanceOverviewChart.chartOptions"
      />
      <v-container class="py-0">
        <v-row
          v-for="(overview, index) in overviewList"
          :key="'balance-overview-' + index"
          no-gutters
          class="py-1"
        >
          <v-col cols>
            <i class="bx bxs-square me-1" :class="'text-' + overview.color"></i>
            {{ overview.title }}</v-col
          >
          <v-col cols class="text-center font-weight-bold">{{
            overview.price
          }}</v-col>
          <v-col cols class="text-center">
            <span :class="overview.isSuccess ? 'text-success' : 'text-danger'"
              ><i v-if="overview.isSuccess" class="bx bxs-up-arrow"></i>
              <i v-else class="bx bxs-down-arrow"></i>
              <span class="px-1">{{ overview.percent }}</span>
            </span>

            than last years
          </v-col>
          <v-col cols class="balance-overview-view-btn">
            <v-btn variant="text" density="compact" color="primary">
              View All <i class="ph-arrow-right"></i>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </Card>
</template>
