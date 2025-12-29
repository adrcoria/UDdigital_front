<script lang="ts" setup>
import ProductGallery from "@/components/suscriptionModule/ProductDetails/ProductGallery.vue";
import ProductDetail from "@/components/suscriptionModule/ProductDetails/ProductDetail.vue";
import ProductDescription from "@/components/suscriptionModule/ProductDetails/ProductDescription.vue";
import RatingAndReview from "@/components/suscriptionModule/ProductDetails/RatingAndReview.vue";
import {  onMounted} from "vue";

const props = defineProps({
  subscriptionData: {
    type: Object,
    default: () => null,
  },
});

onMounted(() => {
  console.log("subscriptionData", props.subscriptionData);
});

// Convertimos la prop a una referencia reactiva para trabajar con ella


</script>
<template>
  <v-row>
    <!-- <v-col lg="4">
      <ProductGallery :subscription="props.subscriptionData" />
    </v-col> -->
    <v-col lg="12">
      <!-- Se pasan los detalles ya procesados al componente ProductDetail -->
      <!-- <ProductDetail :subscription="props.subscriptionData" /> -->
      <!-- Se le pasa la data completa para que ProductDescription muestre más información -->
      <ProductDescription :subscription="props.subscriptionData" class="mt-1" />
    </v-col>
  </v-row>
  <!-- Si deseas habilitar el componente RatingAndReview, descomenta la siguiente sección:
  <v-row>
    <v-col cols="12">
      <RatingAndReview :subscriptionData="subscriptionData" />
    </v-col>
  </v-row> -->
</template>
