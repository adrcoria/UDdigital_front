<script lang="ts" setup>
defineProps<{
  browsers: {
    name: string;   // Nombre
    last_name: string; // Apellido
    phone: string;
    subscriptionWorkOrdersCount: number;
    sinisterWorkOrdersCount: number;
    harvestWorkOrdersCount: number;
  }[];
}>();
</script>

<template>
  <Card title="Ordenes  de trabajo">
    <v-card-text>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Técnico</th>
            <th>Teléfono</th>
            <th class="text-center">Suscripciones</th>
            <th class="text-center">Siniestros</th>
            <th class="text-center">Cosechas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in browsers" :key="index" height="47">
            <td>
              {{ item.name }} {{ item.last_name }}
            </td>
            <td>
              {{ item.phone }}
            </td>
            <td class="text-center">
              {{ item.subscriptionWorkOrdersCount }}
            </td>
            <td class="text-center">
              {{ item.sinisterWorkOrdersCount }}
            </td>
            <td class="text-center">
              {{ item.harvestWorkOrdersCount }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </Card>
</template>
