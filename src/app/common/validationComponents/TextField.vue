<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { required, email } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { type PropType } from "vue";
import { DensityType } from "@/app/common/types/form.type";

const props = defineProps({
  modelValue: { type: Object, default: undefined },
  title: { type: String, default: "" },
  isRequired: { type: Boolean, default: false },
  isEmail: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  hideDetails: { type: Boolean, default: false },
  showError: { type: Boolean, default: false },
  type: { type: String, default: "text" },
  isSubmitted: { type: Boolean, default: false },
  maxLength: { type: String, default: undefined },
  id: { type: String, default: undefined },
  isPassword: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  customClass: { type: String, default: "" },
  label: { type: String, default: "" },
  density: {
    type: String as PropType<DensityType>,
    default: "compact",
  },
});
const emit = defineEmits(["update:modelValue", "keyup"]);

const showPassword = ref(false);
const isValidation = computed(() => {
  return props.isRequired || props.isEmail;
});

const fieldValue = computed({
  get() {
    if (isValidation.value) {
      return (props.modelValue && props.modelValue.value) || "";
    } else {
      return props.modelValue || "";
    }
  },
  set(newValue: string) {
    if (isValidation.value) {
      emit("update:modelValue", {
        value: newValue,
        isValid: isValid.value,
      });
    } else {
      emit("update:modelValue", newValue);
    }
  },
});

const rules = {
  fieldValue: {
    required: props.isRequired ? required : {},
    email: props.isEmail ? email : {},
  },
};

const v$ = useVuelidate(rules, { fieldValue });

const onChange = () => {
  if (isValidation.value) {
    v$.value.$touch();
    emit("update:modelValue", {
      value: fieldValue.value,
      isValid: isValid.value,
    });
  }
};

const isSubmitted = computed(() => props.isSubmitted);
const isValid = computed(() => v$.value.fieldValue.$errors.length === 0);

const getType = computed(() => {
  if (props.isPassword) {
    if (!showPassword.value) {
      return "password";
    }
  }

  return props.type || "text";
});

watch(isSubmitted, () => {
  onChange();
});
</script>
<template>
  <div :class="customClass">
    <v-text-field
      v-model="fieldValue"
      variant="solo"
      :density="density"
      :type="getType"
      class="text-field-component"
      :hide-details="hideDetails"
      :placeholder="placeholder"
      :maxLength="maxLength"
      :label="label"
      :disabled="disabled"
      :id="id"
      :class="{
        'is-invalid': isSubmitted && showError && !isValid,
        'is-valid': isSubmitted && showError && isValid,
      }"
      @input="onChange"
      @keyup="emit('keyup', $event)"
    >
      <template #append-inner>
        <v-btn
          v-if="isPassword"
          density="compact"
          class="text-muted"
          :icon="showPassword ? 'ph-eye' : 'ph-eye-slash'"
          @click="showPassword = !showPassword"
        />
        <slot name="append-inner" />
      </template>
      <template #prepend-inner>
        <slot name="prepend-inner" />
      </template>
    </v-text-field>
  </div>
  <div
    v-if="isSubmitted && showError && v$.fieldValue.$invalid"
    class="invalid-feedback"
  >
    <span v-for="error in v$.fieldValue.$errors">
      {{ error.$message }}
    </span>
  </div>
  <div v-if="isSubmitted && showError && !v$.fieldValue.$invalid">
    <slot name="success-message" />
  </div>
</template>
