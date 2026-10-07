<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  roleService,
  webSectionService,
  permitService,
} from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";
import {
  roleLabel,
  rutaExisteEnElFront,
  type Role,
  type WebSection,
  type Permit,
} from "./utils";

/**
 * Matriz rol × sección.
 *
 * El API reemplaza los permisos de un rol completo, así que el guardado es
 * por rol: solo se mandan los roles que el usuario realmente modificó.
 */

const loading = ref(false);
const savingRole = ref<string | null>(null);

const roles = ref<Role[]>([]);
const sections = ref<WebSection[]>([]);

/** Estado en pantalla: roleId -> Set de secciones marcadas */
const asignado = ref<Record<string, Set<string>>>({});
/** Copia de lo que hay en el servidor, para saber qué cambió */
const original = ref<Record<string, Set<string>>>({});

const desordenado = (a: Set<string>, b: Set<string>) =>
  a.size !== b.size || [...a].some((id) => !b.has(id));

const rolesModificados = computed(() =>
  roles.value.filter((r) =>
    desordenado(asignado.value[r.id] ?? new Set(), original.value[r.id] ?? new Set())
  )
);

const hayCambios = computed(() => rolesModificados.value.length > 0);

const sacarLista = (res: any): any[] => {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.list)) return d.list;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const cargar = async () => {
  try {
    loading.value = true;

    const [resRoles, resSections, resPermits] = await Promise.all([
      // Solo roles activos: los dados de baja no deben aparecer en la matriz
      roleService.getActiveRoles(),
      webSectionService.getSections(),
      permitService.getPermits(),
    ]);

    // La matriz se arma con lo que devuelve la API: un rol nuevo aparece solo
    roles.value = sacarLista(resRoles);
    sections.value = sacarLista(resSections);

    const permits: Permit[] = sacarLista(resPermits);

    const mapa: Record<string, Set<string>> = {};
    for (const rol of roles.value) mapa[rol.id] = new Set();
    for (const permiso of permits) {
      const seccion = permiso.webSectionId ?? permiso.webSection?.id;
      if (!permiso.roleId || !seccion) continue;
      (mapa[permiso.roleId] ??= new Set()).add(seccion);
    }

    asignado.value = mapa;
    original.value = Object.fromEntries(
      Object.entries(mapa).map(([rol, set]) => [rol, new Set(set)])
    );
  } catch {
    showErrorAlert("No se pudieron cargar los permisos");
  } finally {
    loading.value = false;
  }
};

const tienePermiso = (roleId: string, sectionId: string) =>
  asignado.value[roleId]?.has(sectionId) ?? false;

const alternar = (roleId: string, sectionId: string) => {
  const set = (asignado.value[roleId] ??= new Set());
  if (set.has(sectionId)) set.delete(sectionId);
  else set.add(sectionId);
  // Reasignar para que Vue note el cambio del Set
  asignado.value = { ...asignado.value };
};

const marcarTodo = (roleId: string, valor: boolean) => {
  asignado.value[roleId] = valor
    ? new Set(sections.value.map((s) => s.id))
    : new Set();
  asignado.value = { ...asignado.value };
};

const guardarRol = async (rol: Role) => {
  try {
    savingRole.value = rol.id;
    const ids = [...(asignado.value[rol.id] ?? new Set())];

    await permitService.setRolePermits(rol.id, ids);

    original.value[rol.id] = new Set(ids);
    original.value = { ...original.value };
    showSuccessAlert(`Permisos de ${roleLabel(rol)} actualizados`);
  } catch (error: any) {
    const msg = error.response?.data?.message;
    showErrorAlert(
      Array.isArray(msg) ? msg[0] : msg || `No se pudieron guardar los permisos de ${roleLabel(rol)}`
    );
  } finally {
    savingRole.value = null;
  }
};

const guardarTodo = async () => {
  for (const rol of [...rolesModificados.value]) await guardarRol(rol);
};

const descartar = () => {
  asignado.value = Object.fromEntries(
    Object.entries(original.value).map(([rol, set]) => [rol, new Set(set)])
  );
};

const conteo = (roleId: string) => asignado.value[roleId]?.size ?? 0;

onMounted(cargar);

defineExpose({ cargar });
</script>

<template>
  <v-card>
    <v-card-title class="py-4">
      <v-row class="w-100" align="center" no-gutters>
        <v-col cols="12" sm="auto">
          <div class="text-h6">Permisos por rol</div>
          <div class="text-caption text-medium-emphasis">
            Marca las secciones que cada rol puede ver en su menú
          </div>
        </v-col>

        <v-spacer />

        <v-col cols="12" sm="auto" class="d-flex ga-2 mt-2 mt-sm-0">
          <v-btn
            variant="text"
            prepend-icon="ph-arrow-counter-clockwise"
            :disabled="!hayCambios || !!savingRole"
            @click="descartar"
          >
            Descartar
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="ph-floppy-disk"
            :disabled="!hayCambios"
            :loading="!!savingRole"
            @click="guardarTodo"
          >
            Guardar cambios
            <v-chip v-if="hayCambios" size="x-small" class="ml-2" color="white">
              {{ rolesModificados.length }}
            </v-chip>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <div v-if="loading" class="pa-4">
      <v-skeleton-loader type="table-row@5" />
    </div>

    <div v-else-if="!roles.length || !sections.length" class="text-center py-10 text-grey">
      <v-icon size="48" class="mb-2">ph-shield-warning</v-icon>
      <div class="text-body-2">
        {{ !roles.length ? "No hay roles registrados" : "No hay secciones registradas" }}
      </div>
      <div v-if="!sections.length" class="text-caption">
        Las secciones son estructura del sistema y se cargan en base de datos:
        ejecuta <strong>scripts/web-sections.sql</strong> para darlas de alta.
      </div>
    </div>

    <div v-else class="pa-4" style="overflow-x: auto;">
      <v-table density="compact" class="matriz">
        <thead>
          <tr>
            <th class="seccion-col bg-grey-lighten-4 text-caption font-weight-bold">
              Sección
            </th>
            <th
              v-for="rol in roles"
              :key="rol.id"
              class="bg-grey-lighten-4 text-center text-caption font-weight-bold text-no-wrap"
            >
              {{ roleLabel(rol) }}
              <div class="text-caption font-weight-regular text-medium-emphasis">
                {{ conteo(rol.id) }} de {{ sections.length }}
              </div>
              <div class="d-flex justify-center ga-1 mt-1">
                <v-btn
                  size="x-small"
                  variant="text"
                  title="Marcar todas"
                  icon="ph-check-square"
                  @click="marcarTodo(rol.id, true)"
                />
                <v-btn
                  size="x-small"
                  variant="text"
                  title="Desmarcar todas"
                  icon="ph-square"
                  @click="marcarTodo(rol.id, false)"
                />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="seccion in sections" :key="seccion.id">
            <td class="seccion-col">
              <div class="d-flex align-center ga-2">
                <span class="font-weight-medium text-caption">{{ seccion.name }}</span>
                <v-chip v-if="!seccion.isActive" size="x-small" color="warning" variant="tonal">
                  Inactiva
                </v-chip>
                <v-tooltip
                  v-if="seccion.description"
                  :text="seccion.description"
                  location="right"
                >
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" color="grey-lighten-1">
                      ph-info
                    </v-icon>
                  </template>
                </v-tooltip>

                <!-- La ruta ya no se muestra, pero si no existe el permiso
                     no protege nada: eso sí hay que avisarlo -->
                <v-tooltip
                  v-if="!rutaExisteEnElFront(seccion.path)"
                  :text="`La ruta ${seccion.path} no corresponde a ninguna pantalla del sistema`"
                  location="right"
                >
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" color="warning">ph-warning</v-icon>
                  </template>
                </v-tooltip>
              </div>
            </td>

            <td v-for="rol in roles" :key="`${seccion.id}-${rol.id}`" class="text-center">
              <v-checkbox-btn
                :model-value="tienePermiso(rol.id, seccion.id)"
                color="primary"
                class="d-inline-flex"
                @update:model-value="alternar(rol.id, seccion.id)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <v-divider v-if="hayCambios" />
    <div v-if="hayCambios" class="pa-4 pt-3">
      <v-alert type="info" variant="tonal" density="compact" class="text-caption">
        Cambios sin guardar en:
        <strong>{{ rolesModificados.map(roleLabel).join(", ") }}</strong>.
        Los permisos se aplican cuando el usuario vuelve a iniciar sesión.
      </v-alert>
    </div>
  </v-card>
</template>

<style scoped>
.matriz .seccion-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fff;
  min-width: 260px;
}

.matriz thead .seccion-col {
  z-index: 2;
}

th,
td {
  vertical-align: middle;
}
</style>
