<script lang="ts" setup>
import { ref } from "vue";
import { permission } from "@/assets/images/auth/utils";

const form = ref([
  { value: "", isValid: true },
  { value: "", isValid: true },
  { value: "", isValid: true },
  { value: "", isValid: true }
]);
const isSubmitted = ref(false);

const getElement = (index: number) => {
  return document.getElementById(`digit-${index}`);
};
const moveToNext = (event: any, nextIndex: number) => {
  if (event.key !== "Backspace") {
    if (nextIndex < 5) {
      getElement(nextIndex)?.focus();
    } else {
      getElement(nextIndex)?.blur();
    }
  }
};
const moveToPrev = (event: any, prevIndex: number) => {
  if (event.key === "Backspace") {
    if (prevIndex > 0) {
      getElement(prevIndex)?.focus();
    } else {
      getElement(prevIndex)?.blur();
    }
  }
};
</script>
<template>
  <div class="h-100 d-flex align-center justify-center">
    <div class="w-100">
      <v-card-title class="text-center">
        <v-img :src="permission" height="60" />

        <h5 class="text-h6 font-weight-bold mt-4">Verify Your Email</h5>
        <div class="text-muted mt-1 font-weight-regular">
          Please enter the 4 digit code sent to <b>example@abc.com</b>
        </div>
      </v-card-title>
      <v-card-text>
        <v-row justify="center" class="align-center">
          <v-col cols="12" lg="8">
            <v-row class="mt-4">
              <v-col cols="3" v-for="(item, index) in form" :key="index">
                <div class="mb-3">
                  <TextField
                    class="two-step-verification-field"
                    v-model="item.value"
                    :id="`digit-${index + 1}`"
                    placeholder="0"
                    maxLength="1"
                    isRequired
                    :showError="true"
                    :isSubmitted="isSubmitted"
                    hide-details
                    @keyup="moveToNext($event, index + 2)"
                    @keyup.delete="moveToPrev($event, index)"
                  />
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row justify="center" class="align-center">
          <v-col cols="12" lg="8">
            <v-btn
              color="primary"
              block
              height="40"
              @click="isSubmitted = true"
            >
              Confirm
            </v-btn>
          </v-col>
        </v-row>

        <div class="text-center mt-5 d-flex align-center justify-center">
          Didn't receive a code ?
          <v-btn
            to="/auth/pass-reset"
            variant="text"
            color="primary"
            class="font-weight-bold text-decoration-underline pa-0"
          >
            Resent
          </v-btn>
        </div>
      </v-card-text>
    </div>
  </div>
</template>
