import { createApp, App } from "vue";
import { registerPlugins } from "@/plugins";
import i18n from "@/plugins/i18n";
import AppMain from "@/App.vue";

import "@/assets/scss/app.scss";

import "simplebar";
import "simplebar/dist/simplebar.css";

import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

import "emoji-picker-element";

import { vMaska } from "maska";

import "maz-ui/css/main.css";
import MazPhoneNumberInput from "maz-ui/components/MazPhoneNumberInput";

import VueApexCharts from "vue3-apexcharts";

import CountTo from "@/app/lib/CountTo.vue";
import ListMenu from "@/app/common/components/ListMenu.vue";
import ListMenuWithIcon from "@/app/common/components/ListMenuWithIcon.vue";
import Card from "@/app/common/components/Card.vue";
import Breadcrumb from "@/app/common/components/Breadcrumb.vue";
import TextField from "@/app/common/validationComponents/TextField.vue";
import TextArea from "@/app/common/validationComponents/TextArea.vue";

const app: App = createApp(AppMain);
registerPlugins(app);

app.use(i18n);
app.use(VueApexCharts);

app.component("CountTo", CountTo);
app.component("ListMenu", ListMenu);
app.component("Card", Card);
app.component("VueDatePicker", VueDatePicker);
app.component("ListMenuWithIcon", ListMenuWithIcon);
app.component("Breadcrumb", Breadcrumb);
app.component("TextField", TextField);
app.component("TextArea", TextArea);
app.directive("maska", vMaska);
app.component("MazPhoneNumberInput", MazPhoneNumberInput);

app.mount("#app");
