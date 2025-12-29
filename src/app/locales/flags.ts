import { FlagByLanguageType } from "@/app/locales/types";

import {
  usFlag,
  spainFlag,
  germanyFlag,
  italyFlag,
  russiaFlag,
  chinaFlag,
  frenchFlag,
  aeFlag,
} from "@/assets/images/flags/utils";

export const flagByLanguage: FlagByLanguageType[] = [
  {
    flag: usFlag,
    language: "en",
    title: "English",
  },
  {
    flag: spainFlag,
    language: "sp",
    title: "Española",
  },
  {
    flag: germanyFlag,
    language: "gr",
    title: "Deutsche",
  },
  {
    flag: italyFlag,
    language: "it",
    title: "italiana",
  },
  {
    flag: russiaFlag,
    language: "ru",
    title: "русский",
  },
  {
    flag: chinaFlag,
    language: "ch",
    title: "中國人",
  },
  {
    flag: frenchFlag,
    language: "fr",
    title: "français",
  },
  {
    flag: aeFlag,
    language: "ar",
    title: "عربي",
  },
];
