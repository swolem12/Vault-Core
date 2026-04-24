import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "data", "vendor-libraries");

const FAMILY_RULES = [
  ["PLA_PLUS", /\bPLA\+\b|\bPLA PLUS\b|\bPLA-PRO\b|\bPLA PROFESSIONAL\b|\bPLA PRO\b/i],
  ["PLA_HS", /\bPLA[- ]?HS\b|\bHIGH[ -]?SPEED PLA\b|\bPLA\+HS\b|\bPLA[- ]?HF\b/i],
  ["EPLA", /\bEPLA\b|\bEASY PLA\b/i],
  ["MATTE_PLA", /\bMATTE PLA\b|\bPLA MATTE\b/i],
  ["SILK_PLA", /\bSILK PLA\b|\bPLA SILK\b/i],
  ["PLA_CF", /\bPLA[- ]?CF\b|\bCARBON FIBER PLA\b/i],
  ["PLA_GF", /\bPLA[- ]?GF\b|\bGLASS FIBER PLA\b/i],
  ["PLA_METAL_COPPER", /\bPLA\b.*\bCOPPER\b/i],
  ["PLA_METAL_STEEL", /\bPLA\b.*\bSTEEL\b/i],
  ["LW_PLA", /\bLW[- ]?PLA\b|\bLIGHT ?WEIGHT PLA\b/i],
  ["PETG_HS", /\bPETG[- ]?HS\b|\bPETG[- ]?HF\b|\bHIGH[ -]?SPEED PETG\b|\bRAPID PETG\b/i],
  ["PETG_CF", /\bPETG[- ]?CF\b|\bCARBON FIBER PETG\b/i],
  ["PETG_GF", /\bPETG[- ]?GF\b|\bGLASS FIBER PETG\b/i],
  ["PETG", /\bPETG\b/i],
  ["ABS_FR", /\bABS[- ]?FR\b/i],
  ["ABS_GF", /\bABS[- ]?GF\b/i],
  ["ABS", /\bABS\b/i],
  ["ASA_CF", /\bASA[- ]?CF\b/i],
  ["ASA_GF", /\bASA[- ]?GF\b/i],
  ["ASA", /\bASA\b/i],
  ["PC_FR", /\bPC[- ]?FR\b/i],
  ["PC_ABS", /\bPC[- ]?ABS\b/i],
  ["PC", /\bPC\b|\bPOLYCARBONATE\b/i],
  ["TPU_85A", /\bTPU[- ]?85A\b/i],
  ["TPU_90A", /\bTPU[- ]?90A\b/i],
  ["TPU_95A", /\bTPU[- ]?95A\b/i],
  ["TPE_83A", /\bTPE[- ]?83A\b/i],
  ["TPE", /\bTPE\b/i],
  ["PEBA", /\bPEBA\b/i],
  ["PAHT_CF", /\bPAHT[- ]?CF\b/i],
  ["PA12_CF", /\bPA12[- ]?CF\b/i],
  ["PA6_CF", /\bPA6[- ]?CF\b/i],
  ["PA6_GF", /\bPA6[- ]?GF\b/i],
  ["PA6", /\bPA6\b|\bPA6[- ]?NYLON\b|\bNYLON 6\b/i],
  ["PA12", /\bPA12\b/i],
  ["PPA_CF", /\bPPA[- ]?CF\b/i],
  ["PPS_CF", /\bPPS[- ]?CF\b/i],
  ["PPS_GF", /\bPPS[- ]?GF\b/i],
  ["SUPPORT_PVA", /\bPVA\b/i],
  ["SUPPORT_BVOH", /\bBVOH\b/i],
  ["HIPS", /\bHIPS\b/i],
  ["FAST_MODEL", /\bFAST\b|\bBUILD\b/i],
  ["TOUGH", /\bBLU\b|\bMAGNA\b|\bTOUGH\b/i],
  ["FLEXIBLE", /\bTENACIOUS\b|\bFLEXIBLE\b/i],
  ["HIGH_TEMP", /\bHIGH TEMP\b|\bSCULPT\b/i],
  ["CASTABLE", /\bCAST\b|\bCASTABLE\b/i],
  ["ABS_LIKE", /\bABS[- ]?LIKE\b|\bMECHA\b|\bSIMPLE\b|\bEASY\b/i],
];

function unique(items) {
  return [...new Set(items)];
}

function familyCandidatesFromText(text) {
  return FAMILY_RULES.filter(([, pattern]) => pattern.test(text)).map(([family]) => family);
}

function productUrl(domain, handle) {
  return `${domain}/products/${handle}`;
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function titleCaseToken(token) {
  if (/^[a-z]\d$/i.test(token) || /^[a-z]{2,}\+\d?$/i.test(token) || /^[a-z]+\+\w+$/i.test(token)) {
    return token.toUpperCase();
  }
  if (/^\d+[a-z]+$/i.test(token)) {
    return token.toUpperCase();
  }
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function inferBambuTitle(handle) {
  const special = {
    "petg-cf": "PETG-CF",
    "paht-cf": "PAHT-CF",
    "pla-cmyk-lithophane": "PLA CMYK Lithophane",
    "pla-basic-filament": "PLA Basic",
    "pla-marble": "PLA Marble",
    "pla-matte-filament": "PLA Matte",
    "pla-sparkle": "PLA Sparkle",
    "pla-metal": "PLA Metal",
    "pla-matte": "PLA Matte",
    "abs-filament": "ABS",
    "pla-cf": "PLA-CF",
    "pc-filament": "PC",
    "pla-basic-gradient": "PLA Basic Gradient",
    "pla-aero": "PLA Aero",
    "asa-filament": "ASA",
    "tpu-95a-hf": "TPU 95A HF",
    "pa6-cf": "PA6-CF",
    "pla-glow": "PLA Glow",
    "pla-silk-multi-color": "PLA Silk Multi-Color",
    "petg-translucent": "PETG Translucent",
    "pva": "PVA",
    "pla-galaxy": "PLA Galaxy",
    "pa6-gf": "PA6-GF",
    "asa-aero": "ASA Aero",
    "abs-gf": "ABS-GF",
    "support-for-pla-petg": "Support for PLA/PETG",
    "petg-hf": "PETG HF",
    "support-for-abs": "Support for ABS",
    "ppa-cf": "PPA-CF",
    "pps-cf": "PPS-CF",
    "pla-wood": "PLA Wood",
    "tpu-for-ams": "TPU for AMS",
    "pla-silk-upgrade": "PLA Silk+",
    "tpu-85a-tpu-90a": "TPU 85A / TPU 90A",
    "support-for-pla-new": "Support for PLA",
    "support-for-pa-pet": "Support for PA/PET",
    "pla-translucent": "PLA Translucent",
    "pc-fr": "PC-FR",
    "pla-tough": "PLA Tough",
    "pla-tough-upgrade": "PLA Tough",
    "petg-basic": "PETG Basic",
  };

  if (special[handle]) {
    return special[handle];
  }

  return handle
    .replace(/-filament$/, "")
    .split("-")
    .map(titleCaseToken)
    .join(" ");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; PrintForgeOpsCatalogBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; PrintForgeOpsCatalogBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

async function fetchShopifyProducts(baseUrl) {
  const products = [];
  let page = 1;

  while (true) {
    const json = await fetchJson(`${baseUrl}${page}`);
    const current = json.products ?? [];
    if (!current.length) {
      break;
    }
    products.push(...current);
    page += 1;
  }

  return products;
}

function extractVariantOptions(product) {
  const options = Array.isArray(product.options) ? product.options : [];
  return options.map((option) => ({
    name: option.name,
    values: unique((option.values ?? []).map((value) => cleanText(String(value)))).sort(),
  }));
}

function summarizeShopifyProduct(product, brand, domain) {
  const text = [product.title, product.product_type, ...(product.tags ?? [])].join(" ");
  return {
    title: cleanText(product.title),
    handle: product.handle,
    sourceUrl: productUrl(domain, product.handle),
    productType: product.product_type || null,
    tags: (product.tags ?? []).map((tag) => cleanText(String(tag))).filter(Boolean),
    variantCount: Array.isArray(product.variants) ? product.variants.length : 0,
    optionSets: extractVariantOptions(product),
    familyCandidates: familyCandidatesFromText(text),
    brand,
  };
}

function isElegooFilament(product) {
  const text = `${product.title} ${product.product_type} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  return (
    text.includes("filament") &&
    !text.includes("resin") &&
    !text.includes("printer") &&
    !text.includes("accessories") &&
    !text.includes("protection")
  );
}

function isSirayaFilament(product) {
  const text = `${product.title} ${product.product_type} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  return text.includes("filament") && !text.includes("adhesive") && !text.includes("silicone");
}

function isSirayaResin(product) {
  const text = `${product.title} ${product.product_type} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  return (product.product_type || "").toLowerCase() === "resin" || text.includes(" resin");
}

function isPolymakerFilament(product) {
  const type = (product.product_type || "").toLowerCase();
  const text = `${product.title} ${type} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  return (
    type.includes("filament") ||
    /\bpla\b|\bpetg\b|\basa\b|\bpc\b|\bnylon\b|\bpa\b|\bpps\b|\bpanchroma\b|\bpolyterra\b|\bpolylite\b|\bpolymide\b|\bfiberon\b/i.test(text)
  ) && !type.includes("hardware") && !type.includes("bundle");
}

function isOvertureFilament(product) {
  return (product.product_type || "").toLowerCase().includes("3d printer filament");
}

function isProtoPastaFilament(product) {
  return (product.product_type || "").toLowerCase() === "3d printer filament";
}

async function buildBambuLibrary() {
  const xml = await fetchText("https://us.store.bambulab.com/sitemap_products_1.xml");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const excludedTerms = [
    "fan",
    "connector",
    "plastic-",
    "module",
    "bundle",
    "pack",
    "balls",
    "ornaments",
    "bearings",
    "gear",
    "hose",
    "air-duct",
  ];
  const handles = unique(
    urls
      .map((url) => {
        try {
          return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
        } catch {
          return "";
        }
      })
      .filter((handle) => /^[a-z0-9-]+$/.test(handle))
      .filter((handle) => /^(pla|petg|abs|asa|tpu|pva|pa|pc|pps|support-for)/.test(handle)),
  )
    .filter((handle) => !excludedTerms.some((term) => handle.includes(term)))
    .sort();

  const entries = handles.map((handle) => {
    const title = inferBambuTitle(handle);
    return {
      brand: "Bambu Lab",
      title,
      handle,
      sourceUrl: productUrl("https://us.store.bambulab.com", handle),
      sourceTitleMethod: "inferred_from_official_sitemap_handle",
      familyCandidates: familyCandidatesFromText(title),
    };
  });

  return {
    brand: "Bambu Lab",
    coverage: "product_line_level_from_official_sitemap",
    sourceUrls: [
      "https://us.store.bambulab.com/sitemap_products_1.xml",
      "https://us.store.bambulab.com/collections/bambu-lab-3d-printer-filament/",
      "https://cdn1.bambulab.com/filament/Bambu-Filament-Guide-EN.pdf",
    ],
    entryCount: entries.length,
    entries,
  };
}

async function buildSunluLibrary() {
  const html = await fetchText("https://sunlu.com/collections/3d-printer-filament");
  const match = html.match(/<script type="application\/json"[^>]*id="__NUXT_DATA__">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("Unable to locate SUNLU __NUXT_DATA__ payload.");
  }

  const payload = JSON.parse(match[1]);

  function resolve(value, seen = new Map()) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < payload.length) {
      if (seen.has(value)) {
        return seen.get(value);
      }
      const target = payload[value];
      const placeholder = Array.isArray(target) ? [] : target && typeof target === "object" ? {} : target;
      seen.set(value, placeholder);
      const resolved = resolve(target, seen);
      if (placeholder && typeof placeholder === "object" && placeholder !== resolved) {
        Object.assign(placeholder, resolved);
      }
      return seen.get(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => resolve(item, seen));
    }

    if (value && typeof value === "object") {
      const output = {};
      for (const [key, nested] of Object.entries(value)) {
        output[key] = resolve(nested, seen);
      }
      return output;
    }

    return value;
  }

  const root = resolve(1);
  const categories = root.pinia.webSetting.headerNav[0].children;

  const entries = categories.flatMap((category) =>
    category.goods.map((item) => ({
      brand: "SUNLU",
      title: item.name,
      handle: item.id,
      category: category.name,
      sourceUrl: `https://sunlu.com/collections/${item.id}`,
      familyCandidates: familyCandidatesFromText(item.name),
    })),
  );

  return {
    brand: "SUNLU",
    coverage: "official_catalog_navigation_material_lines",
    sourceUrls: ["https://sunlu.com/collections/3d-printer-filament"],
    entryCount: entries.length,
    entries,
  };
}

async function buildEsunLibrary() {
  const entriesByUrl = new Map();

  for (let page = 1; page <= 6; page += 1) {
    const url = page === 1 ? "https://www.esun3d.com/filaments/" : `https://www.esun3d.com/filaments/page/${page}/`;
    const html = await fetchText(url);
    const matches = [...html.matchAll(/<h3 class="item_title"><a href="([^"]+)">([^<]+)<\/a><\/h3>/g)];

    for (const [, href, rawTitle] of matches) {
      const title = cleanText(rawTitle);
      entriesByUrl.set(href, {
        brand: "eSUN",
        title,
        sourceUrl: href,
        familyCandidates: familyCandidatesFromText(title),
      });
    }
  }

  const entries = [...entriesByUrl.values()].sort((left, right) => left.title.localeCompare(right.title));

  return {
    brand: "eSUN",
    coverage: "official_filament_index_pages",
    sourceUrls: [
      "https://www.esun3d.com/filaments/",
      "https://www.esun3d.com/general-materials/",
    ],
    entryCount: entries.length,
    entries,
  };
}

async function buildShopifyBrandLibrary({ brand, baseUrl, domain, filter }) {
  const products = await fetchShopifyProducts(baseUrl);
  const entries = products.filter(filter).map((product) => summarizeShopifyProduct(product, brand, domain));

  return {
    brand,
    coverage: "official_storefront_product_feed",
    sourceUrls: [baseUrl.replace(/products\.json\?limit=250&page=$/, "")],
    rawProductCount: products.length,
    entryCount: entries.length,
    entries: entries.sort((left, right) => left.title.localeCompare(right.title)),
  };
}

function buildSummaryMarkdown(libraries, sirayaResinLibrary) {
  const lines = [
    "# Vendor Material Libraries",
    "",
    `Generated: ${libraries.generatedAt}`,
    "",
    "This dataset is a best-effort pull from official vendor sources checked on 2026-04-24.",
    "",
    "Important caveat: \"entire library\" is realistic at the current product-line/storefront level, but not as an immutable all-time SKU mirror.",
    "Color variants, bundles, refill/spool choices, and packaging weights change frequently on vendor stores.",
    "",
    "## Filament Coverage",
    "",
    "| Brand | Coverage | Count | Primary source |",
    "| --- | --- | ---: | --- |",
    ...libraries.filamentLibraries.map(
      (library) => `| ${library.brand} | ${library.coverage} | ${library.entryCount} | ${library.sourceUrls[0]} |`,
    ),
    "",
    "## Resin Coverage",
    "",
    "| Brand | Coverage | Count | Primary source |",
    "| --- | --- | ---: | --- |",
    `| ${sirayaResinLibrary.brand} | ${sirayaResinLibrary.coverage} | ${sirayaResinLibrary.entryCount} | ${sirayaResinLibrary.sourceUrls[0]} |`,
    "",
    "## Notes",
    "",
    "- `Bambu Lab` was built from the official product sitemap. Titles are inferred from official product handles where the storefront did not expose a clean product feed.",
    "- `SUNLU` was built from the official catalog navigation payload because the site did not expose a stable public product JSON feed.",
    "- `eSUN` was built from the official paginated filament index pages.",
    "- `Elegoo`, `Siraya Tech`, `Polymaker`, `Overture`, and `ProtoPasta` were built from official storefront JSON feeds.",
    "- `Siraya Tech resin library` is separate from the filament brands list and includes official resin product pages only.",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const [
    bambu,
    elegoo,
    esun,
    sunlu,
    sirayaFilaments,
    polymaker,
    overture,
    protoPasta,
    sirayaResins,
  ] = await Promise.all([
    buildBambuLibrary(),
    buildShopifyBrandLibrary({
      brand: "Elegoo",
      baseUrl: "https://us.elegoo.com/products.json?limit=250&page=",
      domain: "https://us.elegoo.com",
      filter: isElegooFilament,
    }),
    buildEsunLibrary(),
    buildSunluLibrary(),
    buildShopifyBrandLibrary({
      brand: "Siraya Tech",
      baseUrl: "https://siraya.tech/products.json?limit=250&page=",
      domain: "https://siraya.tech",
      filter: isSirayaFilament,
    }),
    buildShopifyBrandLibrary({
      brand: "Polymaker",
      baseUrl: "https://us.polymaker.com/products.json?limit=250&page=",
      domain: "https://us.polymaker.com",
      filter: isPolymakerFilament,
    }),
    buildShopifyBrandLibrary({
      brand: "Overture",
      baseUrl: "https://overture3d.com/products.json?limit=250&page=",
      domain: "https://overture3d.com",
      filter: isOvertureFilament,
    }),
    buildShopifyBrandLibrary({
      brand: "ProtoPasta",
      baseUrl: "https://proto-pasta.com/products.json?limit=250&page=",
      domain: "https://proto-pasta.com",
      filter: isProtoPastaFilament,
    }),
    buildShopifyBrandLibrary({
      brand: "Siraya Tech",
      baseUrl: "https://siraya.tech/products.json?limit=250&page=",
      domain: "https://siraya.tech",
      filter: isSirayaResin,
    }),
  ]);

  const libraryPayload = {
    generatedAt: new Date().toISOString(),
    filamentLibraries: [bambu, elegoo, esun, sunlu, sirayaFilaments, polymaker, overture, protoPasta],
    resinLibraries: [sirayaResins],
  };

  await writeFile(
    path.join(outputDir, "official-material-libraries.json"),
    `${JSON.stringify(libraryPayload, null, 2)}\n`,
    "utf8",
  );

  await writeFile(
    path.join(outputDir, "README.md"),
    buildSummaryMarkdown(libraryPayload, sirayaResins),
    "utf8",
  );

  console.log("Wrote", path.join(outputDir, "official-material-libraries.json"));
  console.log("Wrote", path.join(outputDir, "README.md"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
