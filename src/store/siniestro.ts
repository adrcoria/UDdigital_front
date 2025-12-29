import { defineStore } from 'pinia';

export const useSiniestroStore = defineStore('siniestro-store', {
  state: () => ({
    siniestroSeleccionado: null as any, // o define una interfaz si tienes
  }),
  actions: {
    setSiniestro(siniestro: any) {
      this.siniestroSeleccionado = siniestro;
    },
    clearSiniestro() {
      this.siniestroSeleccionado = null;
    }
  },
});
