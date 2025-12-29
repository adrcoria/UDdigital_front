// useGlobalLoading.ts
import { ref } from "vue";

const globalLoading = ref(false);

// Este contador sirve para manejar múltiples requests en paralelo
let requestCount = 0;

function startLoading() {
  requestCount++;
  globalLoading.value = true;
}

function stopLoading() {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0;
    globalLoading.value = false;
  }
}

export function useGlobalLoading() {
  return {
    globalLoading,
    startLoading,
    stopLoading,
  };
}
