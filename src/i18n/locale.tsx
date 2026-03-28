import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLocale = "en" | "fi" | "pirate" | "alien";

type LocaleContextValue = {
  commandNotFound: (command: string) => string;
  languageLabel: (locale: AppLocale) => string;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (input: string) => string;
  themeName: (themeId: string) => string;
};

const STORAGE_KEY = "suuronen.desktop.locale";

const themeNames: Record<string, string> = {
  "amber-drift": "Amber Drift",
  "aurora-blueprint": "Aurora Blueprint",
  "ember-terminal": "Ember Terminal",
  "midnight-copper": "Midnight Copper",
  "mono-studio": "Mono Studio",
  "rose-signal": "Rose Signal",
  "sage-circuit": "Sage Circuit",
  "violet-afterglow": "Violet Afterglow",
  custom: "Custom",
};

const finnishTranslations: Record<string, string> = {
  About: "Tietoa",
  "About page": "Tietosivu",
  "A few easy ways to get in touch.": "Muutama helppo tapa ottaa yhteyttä.",
  "Application language": "Sovelluksen kieli",
  "A reliable choice for large backend systems, infra-oriented services, and clean deployment paths.":
    "Luotettava valinta suuriin backend-järjestelmiin, infra-painotteisiin palveluihin ja selkeisiin toimituspolkuihin.",
  Accent: "Korosteväri",
  "Apply full-screen effects": "Kayta koko nayton tehosteita",
  Alien: "Muukalainen",
  "Adjust core shell colors": "Säädä käyttöliittymän päävärejä",
  "AI + data tooling": "AI- ja datatyökalut",
  "AI + Data Toolkit": "AI- ja datatyökalut",
  "AI with curiosity": "AI uteliaalla otteella",
  Appearance: "Ulkoasu",
  Applications: "Sovellukset",
  "Available channels": "Yhteydenottokanavat",
  "available commands:": "käytettävissä olevat komennot:",
  "list available commands": "listaa käytettävissä olevat komennot",
  "Backend APIs, data-heavy workflows, and AI or CV experiments without changing lanes.":
    "Backend-rajapintoja, dataintensiivisiä työnkulkuja sekä AI- ja konenäkö-kokeiluja ilman kaistanvaihtoa.",
  "Backend engineering, first": "Backend-kehitys ensin",
  "Backend systems": "Backend-järjestelmät",
  "Backend Systems": "Backend-järjestelmät",
  Browser: "Selain",
  "Browser address": "Selaimen osoite",
  "Browser sections": "Selaimen osiot",
  Calculator: "Laskin",
  Category: "Kategoria",
  "Choose a desktop mood": "Valitse työpöydän tunnelma",
  "Cloud infrastructure": "Pilvi-infrastruktuuri",
  Contact: "Yhteys",
  contact: "yhteys",
  "Contact shortcut": "Yhteysoikopolku",
  "contact information:": "yhteystiedot:",
  "Content workspace": "Sisältötyötila",
  "Core languages and frameworks I reach for when building production backend systems.":
    "Keskeiset kielet ja kehykset, joihin nojaan rakentaessani tuotantotason backend-järjestelmiä.",
  "Current language": "Nykyinen kieli",
  "Current filter": "Nykyinen suodatin",
  "Current shell build": "Nykyinen shell-versio",
  "Current theme": "Nykyinen teema",
  "Currently working as a backend engineer, I spend most of my time around backend systems, infrastructure, and implementation details. Currently making software to make game development accessible for anyone":
    "Työskentelen tällä hetkellä backend-insinöörinä, joten suurin osa ajastani kuluu backend-järjestelmien, infrastruktuurin ja toteutuksen yksityiskohtien parissa. Tällä hetkellä rakennan ohjelmistoa, joka tekee pelinkehityksestä saavutettavaa kaikille.",
  "Currently working on": "Työn alla",
  Custom: "Mukautettu",
  Databases: "Tietokannat",
  "Data stores": "Tietovarastot",
  Desktop: "Työpöytä",
  "Desktop launchers": "Työpöydän käynnistimet",
  "Desktop Settings": "Työpöydän asetukset",
  "Dark chrome": "Tumma kehys",
  "Direct route for collaboration, questions, or project discussion.": "Nopein reitti yhteistyöhön, kysymyksiin tai projektikeskusteluun.",
  Email: "Sähköposti",
  English: "Englanti",
  "Email for the quickest route. GitHub and LinkedIn for the public trail of what I build and what I work on.":
    "Sähköposti on nopein reitti. GitHub ja LinkedIn näyttävät julkisen jäljen siitä, mitä rakennan ja minkä parissa työskentelen.",
  "Fine tune": "Hienosäätö",
  "Backend engineer by trade, terminal goblin by aesthetic, builder of systems that should behave under pressure.":
    "Ammatiltani backend-insinööri, estetiikaltani terminaaligoblin, ja sellaisten järjestelmien rakentaja joiden pitää toimia paineen alla.",
  "Python, Go, Kotlin, cloud-heavy backend work, a bit of AI curiosity, and enough frontend sense to make the interface worth opening.":
    "Pythonia, Goa, Kotlinia, pilvipainotteista backend-työtä, ripaus AI-uteliaisuutta ja juuri tarpeeksi frontend-järkeä, jotta käyttöliittymän avaaminen kannattaa.",
  "If you want the actual links, run contact.": "Jos haluat varsinaiset linkit, aja komento contact.",
  Filters: "Suodattimet",
  Frontend: "Frontend",
  "Frontend and apps": "Frontend ja sovellukset",
  "Frontend to impress. User experience to actually stick them around. The best software is accessible for anyone.":
    "Frontend, joka tekee vaikutuksen. Käyttökokemus, joka oikeasti pitää ihmiset mukana. Paras ohjelmisto on saavutettavaa kaikille.",
  "Folder with additional apps": "Kansio lisäsovelluksille",
  "Full end to end ownership of projects, from design to implementation.":
    "Projektien täysi omistajuus alusta loppuun, suunnittelusta toteutukseen.",
  "Fullstack + App Platforms": "Fullstack + sovellusalustat",
  "Get in touch.": "Ota yhteyttä.",
  "Google Cloud": "Google Cloud",
  "Google Cloud experience across deployment, access control, storage, networking, and compute.": "Google Cloud -kokemusta käyttöönoton, käyttöoikeuksien, tallennuksen, verkkojen ja laskennan parissa.",
  "Grouped by the kinds of systems I like building: backend-heavy services first, then cloud, product layers, data, and operational tooling around them.":
    "Ryhmitelty niiden järjestelmien mukaan, joita rakennan mielelläni: ensin backend-painotteiset palvelut, sitten pilvi, tuotekerrokset, data ja niiden ympärillä oleva operatiivinen työkalutus.",
  "Hi, im Emil.": "Hei, olen Emil.",
  "Hit me up for collaboration or inquiries.": "Ota yhteyttä yhteistyötä tai kyselyitä varten.",
  "If the page does not support iframe embedding, this browser will fall back to a local unavailable page.":
    "Jos sivu ei tue iframe-upotusta, tämä selain siirtyy paikalliseen ei saatavilla -sivuun.",
  "Interested in AI workflows and integrations. Experimenting with diffusion models and generative AI, and interested in integrating custom AI tooling to actual workflows.":
    "Kiinnostunut AI-työnkuluista ja integraatioista. Kokeilen diffuusiomalleja ja generatiivista AI:ta sekä mietin, miten räätälöidyt AI-työkalut saadaan oikeisiin työnkulkuihin.",
  Language: "Kieli",
  "Learning a lot of stuff and trying to keep up with the latest and greatest. Not a master of all, but confident in a few.":
    "Opettelen jatkuvasti uutta ja yritän pysyä ajan tasalla. En ole kaiken mestari, mutta muutamissa asioissa vahva.",
  "Libraries I use around computer vision, tensor work, analysis, and Python-side experimentation.":
    "Kirjastoja, joita käytän konenäön, tensorityön, analyysin ja Python-puolen kokeilun ympärillä.",
  "Loading page": "Ladataan sivua",
  Maximize: "Suurenna",
  Minimize: "Pienennä",
  "Most comfortable": "Mukavin työkalupakki",
  "Mono Studio": "Mono Studio",
  "No filter": "Ei suodatinta",
  Noir: "Noir",
  "Open in new tab": "Avaa uudessa välilehdessä",
  "Open browser home": "Avaa selaimen etusivu",
  "Open Browser": "Avaa selain",
  "Open Calculator": "Avaa laskin",
  "Open profile": "Avaa profiili",
  "Open Settings": "Avaa asetukset",
  "Open Terminal": "Avaa terminaali",
  "Ops + Observability": "Ylläpito + observability",
  "Page not available": "Sivu ei ole saatavilla",
  "Panel surface": "Paneelin pinta",
  "Personal web workspace": "Henkilökohtainen verkkotyötila",
  "Pinned": "Kiinnitetyt",
  "Pinned apps and quick links": "Kiinnitetyt sovellukset ja pikalinkit",
  "Platform services": "Alustapalvelut",
  "Platform tooling": "Alustatyökalut",
  "Placeholder shell menu": "Työpöydän shell-valikko",
  "Preset desktop palette": "Valmis työpöytäteema",
  "Preset themes": "Valmiit teemat",
  Profile: "Profiili",
  "Professional profile": "Ammatillinen profiili",
  "Primary languages": "Pääkielten valikoima",
  Pirate: "Piraatti",
  "Quick Links": "Pikalinkit",
  "Quick math": "Pikamatikka",
  "Reach out": "Yhteys",
  "Reset to default": "Palauta oletus",
  "Rose Signal": "Rose Signal",
  Restore: "Palauta",
  "Sage Circuit": "Sage Circuit",
  Settings: "Asetukset",
  "Section highlights": "Osion kohokohdat",
  "Scientific and ML stack": "Tieteellinen ja ML-pino",
  "Service frameworks": "Palvelukehykset",
  "show contact links": "näytä yhteyslinkit",
  "show startup banner again": "näytä käynnistysbanneri uudelleen",
  "print current user": "näytä nykyinen käyttäjä",
  "print working directory": "näytä nykyinen hakemisto",
  "list desktop files": "listaa työpöydän tiedostot",
  "show tiny workspace tree": "näytä pieni työtilapuu",
  "print faux system information": "näytä tekaistut järjestelmätiedot",
  "print current date and time": "näytä nykyinen päivämäärä ja aika",
  "read short profile note": "lue lyhyt profiiliteksti",
  "read stack summary": "lue teknologiapinon yhteenveto",
  "read quick contact note": "lue lyhyt yhteysmuistio",
  "clear terminal output": "tyhjennä terminaalin tuloste",
  "Some websites block iframe embedding or use security policies that prevent this in-browser desktop from rendering them.":
    "Jotkin sivustot estävät iframe-upotuksen tai käyttävät suojauskäytäntöjä, jotka estävät tämän selain-työpöydän renderöimästä niitä.",
  "Stacks if most often reach for and im most keen on.": "Pinoja, joihin tartun useimmin ja joista innostun eniten.",
  "Stack map": "Pinojen kartta",
  Start: "Käynnistä",
  "System info": "Järjestelmätiedot",
  "System shell": "Järjestelmäshelli",
  System: "Järjestelmä",
  "system version 1.0.0": "järjestelmäversio 1.0.0",
  "suuronen.dev desktop": "suuronen.dev-työpöytä",
  "The operational layer I’m comfortable with around local environments, deployments, telemetry, and reliability.":
    "Operatiivinen kerros, jonka kanssa olen sujuva paikallisympäristöjen, julkaistujen palveluiden, telemetrian ja luotettavuuden ympärillä.",
  "The simplest places to find me online. Email is the fastest route, and GitHub or LinkedIn work well when you want context first.":
    "Helpoimmat paikat löytää minut verkossa. Sähköposti on nopein reitti, ja GitHub tai LinkedIn toimivat hyvin silloin, kun haluat ensin hieman kontekstia.",
  "The tools I’m most comfortable shipping with.": "Työkalut, joilla toimitan kaikkein varmimmin.",
  "Theme presets": "Teemaesiasetukset",
  "Violet Afterglow": "Violet Afterglow",
  "Themes and personalization": "Teemat ja personointi",
  "This folder is empty.": "Tämä kansio on tyhjä.",
  "This page could not be displayed inside the browser window.": "Tätä sivua ei voitu näyttää selainikkunan sisällä.",
  "Trying to open this site inside the browser window.": "Yritetään avata tämä sivusto selainikkunan sisällä.",
  "type \"help\" to get started": "kirjoita \"help\" aloittaaksesi",
  "UX + frontend ❤️": "UX + frontend ❤️",
  "Version 1.0.0": "Versio 1.0.0",
  "Changes save automatically.": "Muutokset tallentuvat automaattisesti.",
  "Wallpaper core": "Taustakuvan ydin",
  "Wallpaper highlight": "Taustakuvan korostus",
  "Wallpaper shadow": "Taustakuvan varjo",
  "Web foundations": "Verkon perusteet",
  "When the backend needs a polished product layer, these are the tools I tend to bring with it.":
    "Kun backend tarvitsee viimeistellyn tuotekerroksen, nämä ovat työkalut, jotka tuon yleensä mukaan.",
  "Amber Drift": "Amber Drift",
  "Aurora Blueprint": "Aurora Blueprint",
  CRT: "CRT",
  "Ember Terminal": "Ember Terminal",
  Close: "Sulje",
  Glitch: "Glitch",
  Hologram: "Hologrammi",
  Inverted: "Kaannetty",
  "Midnight Copper": "Midnight Copper",
  "Night Vision": "Yonakyma",
  "Sunset Bloom": "Iltaruskon hehku",
  "Clean desktop rendering with no extra post-processing.": "Puhdas tyopoytarenderointi ilman ylimaaraisia jalikatehosteita.",
  "Full desktop inversion for a sharp negative-film look.": "Koko tyopoydan kaanto teravaksi negatiivifilmimaiseksi ilmeeksi.",
  "Scanlines, vignette, and a tiny bit of old-monitor flicker.": "Skannausviivat, vinjetti ja pieni vanhan nayton valke.",
  "Chromatic drift, data bars, and noisy distortion on top of the shell.": "Kromaattinen vaeltelu, databaarit ja kohinainen hairio shellin paalla.",
  "Monochrome contrast pass with a cleaner editorial feel.": "Yksivarinen kontrastikierros siistimmalla editoriaalisella tunnelmalla.",
  "Cool-toned cyan and magenta treatment with a subtle sci-fi cast.": "Viileasavyinen syaani-magenta-kasittely hienovaraisella scifi-fiiliksella.",
  "Warm bloom and haze that softens the desktop into a cinematic glow.": "Lamminta hehkua ja sumua, joka pehmentaa tyopoydan elokuvamaiseksi.",
  "Green-tinted tactical display with scan noise and darker shadows.": "Vihreasavyinen taktinen naytto skannauskohinalla ja tummemmilla varjoilla.",
};

const languageNames: Record<AppLocale, string> = {
  en: "English",
  fi: "Suomi",
  pirate: "Pirate",
  alien: "Alien",
};

const alienGlyphs = [
  "۞",
  "⟁",
  "⌬",
  "ᛟ",
  "✶",
  "☍",
  "⟟",
  "⌁",
  "⩔",
  "☾",
  "✹",
  "꙰",
  "🜂",
  "🜄",
  "🝮",
  "🛸",
  "👾",
  "🪐",
  "✨",
  "☄",
  "⚯",
  "⫷",
  "⫸",
  "✦",
  "⟡",
  "⚘",
  "☌",
];

const LocaleContext = createContext<LocaleContextValue | null>(null);

function shouldBypassTranslation(input: string) {
  const trimmed = input.trim();

  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed)
  );
}

function hashChar(seed: string, index: number) {
  let hash = 7 + index * 17;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i) + index) >>> 0;
  }

  return hash;
}

function alienize(input: string) {
  if (shouldBypassTranslation(input)) {
    return input;
  }

  return Array.from(input)
    .map((character, index) => {
      if (/\s/.test(character)) {
        return character;
      }

      const hash = hashChar(`${input}:${character}`, index);
      return alienGlyphs[hash % alienGlyphs.length];
    })
    .join("");
}

function pirateize(input: string) {
  if (shouldBypassTranslation(input)) {
    return input;
  }

  return input
    .replace(/\bhello\b/gi, "ahoy")
    .replace(/\bhi\b/gi, "ahoy")
    .replace(/\bmy\b/gi, "me")
    .replace(/\byou\b/gi, "ye")
    .replace(/\byour\b/gi, "yer")
    .replace(/\bare\b/gi, "be")
    .replace(/\bis\b/gi, "be")
    .replace(/\bfor\b/gi, "fer")
    .replace(/\bto\b/gi, "t'")
    .replace(/\bthe\b/gi, "th'")
    .replace(/\band\b/gi, "an'")
    .replace(/\bof\b/gi, "o'")
    .replace(/\bwith\b/gi, "wit'")
    .replace(/\bthis\b/gi, "this 'ere")
    .replace(/\bcurrently\b/gi, "presently")
    .replace(/\bsettings\b/gi, "ship settings")
    .replace(/\bopen\b/gi, "hoist")
    .replace(/\bquick\b/gi, "swabbie-fast")
    .replace(/\bcontact\b/gi, "parley")
    .replace(/\bbrowser\b/gi, "navigator")
    .replace(/\bdesktop\b/gi, "quarterdeck")
    .replace(/\bversion\b/gi, "mark");
}

function translateText(input: string, locale: AppLocale) {
  if (!input) {
    return input;
  }

  if (locale === "en") {
    return input;
  }

  if (locale === "fi") {
    return finnishTranslations[input] ?? input;
  }

  if (locale === "pirate") {
    return pirateize(input);
  }

  return alienize(input);
}

function getStoredLocale(): AppLocale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "en" || stored === "fi" || stored === "pirate" || stored === "alien") {
      return stored;
    }
  } catch {
    // ignore storage failures
  }

  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(() => getStoredLocale());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (input) => translateText(input, locale),
      commandNotFound: (command) => {
        if (locale === "fi") {
          return `bash: komentoa ${command} ei loytynyt`;
        }

        if (locale === "pirate") {
          return pirateize(`bash: ${command}: command not found`);
        }

        if (locale === "alien") {
          return alienize(`bash: ${command}: command not found`);
        }

        return `bash: ${command}: command not found`;
      },
      languageLabel: (localeId) => translateText(languageNames[localeId], locale),
      themeName: (themeId) => translateText(themeNames[themeId] ?? themeId, locale),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
