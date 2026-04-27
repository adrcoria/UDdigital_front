<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { accountService } from "@/app/http/httpServiceProvider";
import { showSuccessAlert, showErrorAlert } from "@/app/services/alertService";

const router = useRouter();
const loading = ref(false);
const showPassword = ref(false);
const form = ref({ newPassword: "", confirmPassword: "" });
const formRef = ref(null);

const minPass = (v: string) => (v && v.length >= 6) || "Mínimo 6 caracteres";
const notDefault = (v: string) => v !== "T12345678w" || "No puedes usar la contraseña temporal";
const matchRule = (v: string) => v === form.value.newPassword || "Las contraseñas no coinciden";

const onSubmit = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (!valid) return;

  try {
    loading.value = true;
    await accountService.changePassword(form.value.newPassword);

    const storage = localStorage.getItem("accessToken") ? localStorage : sessionStorage;
    storage.removeItem("mustChangePassword");

    showSuccessAlert("Contraseña actualizada correctamente");
    router.push({ path: "/" });
  } catch (error: any) {
    showErrorAlert(error.response?.data?.message || "No se pudo actualizar la contraseña");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-viewport">
    <div class="login-grid">
      <div class="visual-side">
        <div class="gradient-overlay"></div>
        <div class="dots-overlay"></div>
        <div class="text-center z-10 px-6">
          <h1 class="text-h2 font-weight-bold mb-2 title-shadow">BIENVENIDOS</h1>
          <p class="text-h5 opacity-70">Plataforma Digital <br />"Agroindustrias el Arteaguense"</p>
        </div>
        <div class="visual-footer">
          <small>
            <a href="https://leonix.com.mx" target="_blank" class="text-white text-decoration-none">
              © 2025. Desarrollado por <b class="brand-green">Leonix</b>
            </a>
          </small>
        </div>
      </div>

      <div class="form-side">
        <div class="form-inner">
          <div class="text-center mb-8">
            <v-icon size="56" color="primary" class="mb-3">ph-lock-key</v-icon>
            <h2 class="text-h4 font-weight-bold color-primary">Establece tu contraseña</h2>
            <p class="text-body-2 text-grey-darken-1 mt-2">
              Es tu primer inicio de sesión. Por seguridad debes crear una contraseña personal.
            </p>
          </div>

          <v-form ref="formRef" @submit.prevent="onSubmit" class="w-100">
            <div class="field-group">
              <label>Nueva contraseña</label>
              <v-text-field
                v-model="form.newPassword"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[minPass, notDefault]"
                variant="outlined"
                placeholder="Mínimo 6 caracteres"
                prepend-inner-icon="ph-lock"
                color="primary"
                autocomplete="new-password"
              />
            </div>

            <div class="field-group mt-4">
              <label>Confirmar contraseña</label>
              <v-text-field
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                :rules="[matchRule]"
                variant="outlined"
                placeholder="Repite la contraseña"
                prepend-inner-icon="ph-lock-key"
                color="primary"
                autocomplete="new-password"
              />
            </div>

            <v-btn
              color="primary"
              block
              size="x-large"
              class="mt-6 font-weight-bold text-none login-btn"
              elevation="4"
              :loading="loading"
              type="submit"
            >
              Guardar contraseña
            </v-btn>
          </v-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-viewport {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  margin: 0; padding: 0;
  background-color: white;
  z-index: 9999;
}
.login-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%; height: 100%;
}
.visual-side {
  position: relative;
  background-color: #0d0d0d;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  overflow: hidden;
}
.gradient-overlay {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 15% 15%, rgba(25, 118, 210, 0.3) 0%, transparent 55%),
    radial-gradient(circle at 85% 85%, rgba(0, 200, 83, 0.1) 0%, transparent 55%),
    linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
}
.dots-overlay {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px);
  background-size: 35px 35px;
  z-index: 1;
}
.form-side {
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}
.form-inner { width: 100%; max-width: 420px; }
.field-group label {
  display: block;
  font-weight: 700;
  margin-bottom: 5px;
  font-size: 0.85rem;
  color: #333;
}
.color-primary { color: #1976D2; }
.brand-green { color: #00c853; }
.title-shadow { text-shadow: 0 4px 15px rgba(0,0,0,0.6); }
.z-10 { z-index: 10; }
.visual-footer { position: absolute; bottom: 25px; z-index: 10; opacity: 0.8; }
@media (max-width: 960px) {
  .login-grid { grid-template-columns: 1fr; display: flex; flex-direction: column; }
  .visual-side { width: 100%; padding: 60px 20px; height: auto; min-height: 300px; }
  .form-side { width: 100%; padding: 40px 24px; }
}
</style>
