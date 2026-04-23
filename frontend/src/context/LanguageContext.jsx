import React, { createContext, useState } from "react";
import en from "../i18n/en.json";
import hi from "../i18n/hi.json";

export const LanguageContext = createContext();

export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  const translations = lang === "en" ? en : hi;

  const switchLang = (l) => {
    setLang(l);
  };

  return (
    <LanguageContext.Provider value={{ translations, lang, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
}