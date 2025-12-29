<script lang="ts">
import { brandsList } from "@/components/layouts/utils";

export default {
  data() {
    return {
      brandsList,
      userName: "Usuario", // valor por defecto
      rol:""
    };
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    this.userName = user?.name || "Usuario";
    this.rol = user?.role?.name || "Usuario";
  }
};
</script>

<template>
  <v-menu width="175">
    <template v-slot:activator="{ props }">
      <a dark v-bind="props" class="d-flex align-center mx-3">
        <v-avatar size="small" class="user-profile">
          <v-img class="header-profile-user" src="@/assets/images/users/user-dummy-img.jpg" alt="Header Avatar" />
        </v-avatar>
        <span class="text-start ms-xl-3">
          <!-- Se reemplaza el nombre fijo por la variable userName -->
          <h4 class="d-none d-xl-inline-block user-name-text font-weight-medium">
            {{ userName }}
          </h4>
          <span class="d-none d-xl-block user-name-sub-text">Founder</span>
        </span>
      </a>
    </template>
    <v-list density="compact" :lines="false" class="profile-list" nav>
      <h6 class="dropdown-header">¡Hola, {{ userName }}¡ </h6>
      <v-list-item class="dropdown-item" @click="">
        <i class="mdi mdi-account-circle text-muted" />
        {{rol}}
      </v-list-item>
      <v-list-item class="dropdown-item" @click="" to="/signin">
        <i class="mdi mdi-logout text-muted" />
        <span class="align-middle" data-key="t-logout">Cerrar sesión</span>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
