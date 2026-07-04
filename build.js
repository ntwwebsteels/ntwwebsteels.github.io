/* ==========================================================================
   NTW Steel — static site builder
   Reads data/content.json (workflow output) → emits SEO/AEO/GEO HTML pages.
   Run:  node build.js
   ========================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "content.json"), "utf8"));
const DATA = raw.result || raw;
const brand = DATA.brand;
const products = DATA.products;

/* normalize slugs from the generator to clean, stable filenames */
const SLUG_MAP = {
  "steel-plate-base-plate": "plate",
  "screws-and-nuts": "screw-nut",
  "custom-oem-fasteners": "custom",
  "guardrail-bolts-nuts": "guardrail-screw",
};
products.forEach((p) => { if (SLUG_MAP[p.slug]) p.slug = SLUG_MAP[p.slug]; });

const BASE = "https://www.ntwsteel.co.th";      // ← เปลี่ยนเป็นโดเมนจริงของคุณ
const OG_IMAGE = BASE + "/assets/og-cover.svg";
const SITE_NAME = "NTW Steel";

/* ---- Contact placeholders — แก้เป็นข้อมูลจริงของคุณ ---- */
const CONTACT = {
  legalName: "บริษัท เอ็นทีดับเบิลยู สตีล จำกัด",
  phone: "02-XXX-XXXX",
  mobile: "08X-XXX-XXXX",
  email: "sales@ntwsteel.co.th",
  line: "@ntwsteel",
  hours: "จันทร์–เสาร์ 08:00–17:00 น.",
  addr: ["เลขที่ XX/X หมู่ X ถนน—————", "ตำบล————— อำเภอ—————", "จังหวัด————— รหัสไปรษณีย์ XXXXX"],
  addrLocality: "—————",
  addrRegion: "—————",
  postal: "XXXXX",
};

/* ---- product slug → short nav label ---- */
const NAV_LABEL = {
  "j-bolt": "J-Bolt",
  "l-bolt": "L-Bolt",
  "plate": "แผ่นเพลท",
  "screw-nut": "สกรูน็อต",
  "guardrail-screw": "สกรูการ์ดเรล",
  "custom": "งานสั่งผลิต",
};
/* nav display order */
const NAV_ORDER = ["j-bolt", "l-bolt", "plate", "screw-nut", "guardrail-screw", "custom"];
/* home grid order (guardrail highlighted as dark card) */
const GRID_ORDER = ["j-bolt", "l-bolt", "plate", "screw-nut", "guardrail-screw", "custom"];

const bySlug = {};
products.forEach((p) => (bySlug[p.slug] = p));

/* ========================================================================== */
/* helpers                                                                    */
/* ========================================================================== */
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

/* inline line icons (24x24, stroke=currentColor) */
const ICONS = [
  '<path d="M4 20l7-7M9 5l4 4M13 3l8 8-3 3-8-8zM9 15l-2 5 5-2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', // wrench/bolt
  '<path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', // shield-check
  '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>', // factory
  '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.6" stroke="currentColor" stroke-width="1.7" fill="none"/><circle cx="17.5" cy="18" r="1.6" stroke="currentColor" stroke-width="1.7" fill="none"/>', // truck
  '<path d="M6 3h8l4 4v14H6zM14 3v4h4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/><path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>', // doc
  '<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>', // gear
  '<path d="M20 7L10 17l-5-5" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', // check
  '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>', // layers
];
const icon = (i) => `<span class="fcard-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[i % ICONS.length]}</svg></span>`;

function logoMarkup(cls) {
  return `<a class="logo ${cls || ""}" href="index.html" aria-label="NTWSteeL หน้าแรก"><span class="logo-ntw">NTW</span><span class="logo-steel">SteeL</span></a>`;
}

/* image with graceful fallback */
function img(im, cls) {
  if (!im) return "";
  return `<img class="ph ${cls || ""}" src="${escAttr(im.url)}" alt="${escAttr(im.alt || "")}" loading="lazy" decoding="async"${im.credit ? ` data-credit="${escAttr(im.credit)}"` : ""}>`;
}

/* ========================================================================== */
/* shared chrome                                                              */
/* ========================================================================== */
function navHtml() {
  const links = NAV_ORDER.map(
    (s) => `<a href="${s}.html">${esc(NAV_LABEL[s])}</a>`
  ).join("");
  return `<header class="nav">
  <div class="nav-inner">
    ${logoMarkup()}
    <button class="nav-toggle" aria-label="เมนู" aria-expanded="false" aria-controls="site-nav"><span></span><span></span></button>
    <nav class="nav-links" id="site-nav" aria-label="เมนูหลัก">
      ${links}
      <a href="about.html">เกี่ยวกับเรา</a>
      <a class="nav-cta" href="contact.html">ขอใบเสนอราคา</a>
    </nav>
  </div>
</header>`;
}

function footerHtml() {
  const prodLinks = NAV_ORDER.map((s) => `<li><a href="${s}.html">${esc(bySlug[s] ? bySlug[s].nameTh.split(" (")[0] : NAV_LABEL[s])}</a></li>`).join("");
  return `<footer class="footer">
  <div class="wrap-wide">
    <div class="footer-top">
      <div>
        ${logoMarkup()}
        <p class="footer-blurb">${esc(brand.companyTagline)} — ${esc(brand.missionStatement)}</p>
      </div>
      <div>
        <h4>สินค้า</h4>
        <ul>${prodLinks}</ul>
      </div>
      <div>
        <h4>บริษัท</h4>
        <ul>
          <li><a href="about.html">เกี่ยวกับเรา</a></li>
          <li><a href="contact.html">ติดต่อ / ขอใบเสนอราคา</a></li>
          <li><a href="index.html#faq">คำถามที่พบบ่อย</a></li>
          <li><a href="sitemap.xml">Sitemap</a></li>
        </ul>
      </div>
      <div>
        <h4>ติดต่อฝ่ายขาย</h4>
        <ul>
          <li><a href="tel:${escAttr(CONTACT.phone.replace(/[^0-9+]/g, ""))}">โทร ${esc(CONTACT.phone)}</a></li>
          <li><a href="mailto:${escAttr(CONTACT.email)}">${esc(CONTACT.email)}</a></li>
          <li>LINE: ${esc(CONTACT.line)}</li>
          <li>${esc(CONTACT.hours)}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 ${esc(SITE_NAME)} — ${esc(CONTACT.legalName)}. สงวนลิขสิทธิ์.</span>
      <span>ผู้ผลิตและจำหน่ายฟาสเทนเนอร์และงานเหล็ก B2B · จัดส่งทั่วประเทศ</span>
    </div>
  </div>
</footer>`;
}

/* ========================================================================== */
/* document shell                                                             */
/* ========================================================================== */
function page({ slug, title, description, keywords, canonicalPath, bodyClass, graph, body, ogImage }) {
  const canonical = BASE + "/" + canonicalPath;
  const kw = keywords && keywords.length ? `\n  <meta name="keywords" content="${escAttr(keywords.join(", "))}">` : "";
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${escAttr(description)}">${kw}
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="author" content="${esc(SITE_NAME)}">
  <link rel="canonical" href="${escAttr(canonical)}">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="apple-touch-icon" href="assets/favicon.svg">

  <!-- Open Graph -->
  <meta property="og:type" content="${slug === "index" ? "website" : "product"}">
  <meta property="og:site_name" content="${esc(SITE_NAME)}">
  <meta property="og:locale" content="th_TH">
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(description)}">
  <meta property="og:url" content="${escAttr(canonical)}">
  <meta property="og:image" content="${escAttr(ogImage || OG_IMAGE)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(description)}">
  <meta name="twitter:image" content="${escAttr(ogImage || OG_IMAGE)}">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@200;300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/styles.css">

  ${graph.map(ld).join("\n  ")}
</head>
<body class="${bodyClass || ""}">
${navHtml()}
<main id="main">
${body}
</main>
${footerHtml()}
<script src="assets/app.js" defer></script>
</body>
</html>`;
}

/* ========================================================================== */
/* JSON-LD builders                                                           */
/* ========================================================================== */
const orgNode = {
  "@type": "Organization",
  "@id": BASE + "/#organization",
  name: SITE_NAME,
  legalName: CONTACT.legalName,
  alternateName: "เอ็นทีดับเบิลยู สตีล",
  url: BASE + "/",
  logo: BASE + "/assets/logo.svg",
  image: OG_IMAGE,
  slogan: brand.companyTagline,
  description: brand.metaDescription,
  email: CONTACT.email,
  telephone: CONTACT.phone,
  areaServed: { "@type": "Country", name: "Thailand" },
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.addr.join(" "),
    addressLocality: CONTACT.addrLocality,
    addressRegion: CONTACT.addrRegion,
    postalCode: CONTACT.postal,
    addressCountry: "TH",
  },
  knowsAbout: [
    "Anchor bolt", "J-bolt", "L-bolt", "Steel base plate", "Fastener", "Guardrail bolt",
    "Hot-dip galvanizing", "OEM fastener manufacturing", "ASTM F1554", "สลักเกลียวฝังยึด",
  ],
};

function webPageNode(url, name, description, isPart) {
  return {
    "@type": "WebPage",
    "@id": url + "#webpage",
    url,
    name,
    description,
    inLanguage: "th-TH",
    isPartOf: { "@id": BASE + "/#website" },
    ...(isPart ? { primaryImageOfPage: isPart } : {}),
    publisher: { "@id": BASE + "/#organization" },
  };
}

const webSiteNode = {
  "@type": "WebSite",
  "@id": BASE + "/#website",
  url: BASE + "/",
  name: SITE_NAME,
  inLanguage: "th-TH",
  publisher: { "@id": BASE + "/#organization" },
};

function faqNode(url, faq) {
  return {
    "@type": "FAQPage",
    "@id": url + "#faq",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function productNode(p, url) {
  return {
    "@type": "Product",
    "@id": url + "#product",
    name: p.nameTh,
    alternateName: p.nameEn,
    description: p.metaDescription,
    category: p.nameEn,
    sku: "NTW-" + p.slug.toUpperCase(),
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@id": BASE + "/#organization" },
    ...(p.materials && p.materials.length ? { material: p.materials.join(", ") } : {}),
    ...(p.images && p.images.length ? { image: p.images.map((i) => i.url) } : {}),
    ...(p.specs && p.specs.length
      ? { additionalProperty: p.specs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })) }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceCurrency: "THB",
      businessFunction: "http://purl.org/goodrelations/v1#Sell",
      seller: { "@id": BASE + "/#organization" },
      areaServed: { "@type": "Country", name: "Thailand" },
    },
  };
}

/* ========================================================================== */
/* section renderers                                                          */
/* ========================================================================== */
function specTable(p) {
  const rows = p.specs.map((s) => `<tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("\n        ");
  return `<div class="spec-wrap"><table class="spec-table">
        ${rows}
      </table></div>`;
}

function chipGroup(title, arr) {
  if (!arr || !arr.length) return "";
  return `<div class="stack" style="--space:14px">
        <h3 style="font-size:17px;margin-bottom:12px">${esc(title)}</h3>
        <div class="chips">${arr.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
      </div>`;
}

function applications(p) {
  const cards = p.applications
    .map(
      (a, i) => `<div class="usecase reveal ${i % 3 === 1 ? "d1" : i % 3 === 2 ? "d2" : ""}">
        <span class="uc-num">${String(i + 1).padStart(2, "0")}</span>
        <div><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p></div>
      </div>`
    )
    .join("\n      ");
  return cards;
}

function features(p) {
  return p.features
    .map(
      (f, i) => `<div class="fcard reveal ${["", "d1", "d2"][i % 3]}">
        ${icon(i)}
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.desc)}</p>
      </div>`
    )
    .join("\n      ");
}

function faqSection(faq) {
  const items = faq
    .map(
      (f) => `<details>
        <summary>${esc(f.q)}</summary>
        <div class="faq-a">${esc(f.a)}</div>
      </details>`
    )
    .join("\n      ");
  return `<section class="section" id="faq">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">คำถามที่พบบ่อย</span>
        <h2 class="headline">คำถามที่พบบ่อย</h2>
        <p class="lead">ข้อมูลที่ทีมจัดซื้อและวิศวกรถามเราบ่อยที่สุด</p>
      </div>
      <div class="faq">
      ${items}
      </div>
    </div>
  </section>`;
}

function ctaBand(heading, sub) {
  return `<section class="section bg-dark cta-band">
    <div class="wrap">
      <h2 class="headline reveal">${esc(heading)}</h2>
      <p class="lead reveal d1">${esc(sub)}</p>
      <div class="btn-row center reveal d2">
        <a class="btn btn-on-dark btn-lg" href="contact.html">ขอใบเสนอราคา</a>
        <a class="link-chevron" href="tel:${escAttr(CONTACT.phone.replace(/[^0-9+]/g, ""))}" style="color:#fff">โทร ${esc(CONTACT.phone)}</a>
      </div>
    </div>
  </section>`;
}

/* ========================================================================== */
/* PRODUCT PAGE                                                                */
/* ========================================================================== */
function buildProduct(p) {
  const url = `${BASE}/${p.slug}.html`;
  const special = p.slug === "guardrail-screw";
  const heroImg = p.images && p.images[0];
  const midImg = (p.images && p.images[1]) || heroImg;

  const graph = [
    orgNode,
    webSiteNode,
    webPageNode(url, p.nameTh + " | " + SITE_NAME, p.metaDescription),
    productNode(p, url),
    breadcrumbNode([
      { name: "หน้าแรก", url: BASE + "/" },
      { name: "สินค้า", url: BASE + "/#products" },
      { name: p.nameTh, url },
    ]),
    faqNode(url, p.faq),
  ];

  const heroClass = special ? "hero hero-steel hero-grid-bg" : "hero";
  const body = `
  <nav class="wrap crumb" aria-label="breadcrumb">
    <a href="index.html">หน้าแรก</a><span>›</span><a href="index.html#products">สินค้า</a><span>›</span>${esc(p.nameTh.split(" (")[0])}
  </nav>

  <section class="${heroClass}">
    <div class="wrap">
      <span class="eyebrow reveal">${esc(p.nameEn || p.nameTh)}</span>
      <h1 class="display reveal d1">${esc(p.heroHeadline)}</h1>
      <p class="lead reveal d2">${esc(p.heroSubhead)}</p>
      <div class="btn-row center reveal d2">
        <a class="btn ${special ? "btn-on-dark" : "btn-primary"} btn-lg" href="contact.html">ขอใบเสนอราคา</a>
        <a class="link-chevron" href="#specs"${special ? ' style="color:#fff"' : ""}>ดูสเปกและมาตรฐาน</a>
      </div>
    </div>
    ${heroImg ? `<div class="hero-media reveal d3">${img(heroImg)}</div>` : ""}
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="reveal">
          <span class="eyebrow">ภาพรวมผลิตภัณฑ์</span>
          <h2 class="headline" style="margin:12px 0 18px">${esc(p.nameTh.split(" (")[0])} คุณภาพงานโครงการ</h2>
          <p class="lead" style="margin-bottom:16px">${esc(p.intro)}</p>
          <p class="muted">${esc(p.longDescription)}</p>
        </div>
        <div class="split-media reveal d1">${img(midImg)}</div>
      </div>
    </div>
  </section>

  <section class="section bg-alt" id="specs">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">ข้อมูลจำเพาะ</span>
        <h2 class="headline">สเปกและมาตรฐาน</h2>
        <p class="lead">ค่าอ้างอิงทางวิศวกรรม — ปรับตามแบบและข้อกำหนดของโครงการได้</p>
      </div>
      <div class="split" style="align-items:start">
        <div class="reveal">${specTable(p)}</div>
        <div class="stack reveal d1">
          ${chipGroup("วัสดุที่ผลิตได้ (Materials)", p.materials)}
          ${chipGroup("มาตรฐานอ้างอิง (Standards)", p.standards)}
          ${chipGroup("ขนาด (Sizes)", p.sizes)}
          ${chipGroup("การชุบผิว (Finishes)", p.finishes)}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">การใช้งาน</span>
        <h2 class="headline">เหมาะกับงานแบบไหน</h2>
      </div>
      <div class="grid grid-2">
      ${applications(p)}
      </div>
    </div>
  </section>

  <section class="section bg-alt">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">จุดเด่น</span>
        <h2 class="headline">ทำไมต้อง ${esc(SITE_NAME)}</h2>
      </div>
      <div class="grid grid-3">
      ${features(p)}
      </div>
    </div>
  </section>

  ${faqSection(p.faq)}

  ${ctaBand("พร้อมสั่ง " + p.nameTh.split(" (")[0] + " แล้วหรือยัง?", "ส่งแบบหรือสเปกมาให้เรา รับใบเสนอราคาราคาโรงงานพร้อมกำหนดส่งภายใน 24 ชั่วโมงทำการ")}
  `;

  return page({
    slug: p.slug,
    title: `${p.nameTh} | ${SITE_NAME}`,
    description: p.metaDescription,
    keywords: p.keywords,
    canonicalPath: `${p.slug}.html`,
    bodyClass: "",
    graph,
    body,
    ogImage: heroImg ? heroImg.url : OG_IMAGE,
  });
}

/* ========================================================================== */
/* HOME PAGE                                                                   */
/* ========================================================================== */
function buildIndex() {
  const url = BASE + "/";
  const productCards = GRID_ORDER.map((s, i) => {
    const p = bySlug[s];
    const dark = s === "guardrail-screw";
    const im = p.images && (p.images[0] || p.images[1]);
    return `<a class="pcard reveal ${["", "d1", "d2"][i % 3]} ${dark ? "dark" : ""}" href="${p.slug}.html" aria-label="${escAttr(p.nameTh)}">
        <span class="eyebrow">${esc(p.nameEn || "")}</span>
        <h3>${esc(p.nameTh.split(" (")[0])}</h3>
        <p>${esc(p.heroSubhead || p.intro).slice(0, 96)}…</p>
        <span class="pcard-links"><span class="link-chevron"${dark ? ' style="color:#2997ff"' : ""}>ดูรายละเอียด</span></span>
        ${im ? img(im, "pcard-img") : ""}
      </a>`;
  }).join("\n      ");

  const vprops = brand.valueProps
    .map((v, i) => `<div class="fcard reveal ${["", "d1", "d2", ""][i % 4]}">${icon(i)}<h3>${esc(v.title)}</h3><p>${esc(v.desc)}</p></div>`)
    .join("\n      ");

  const whyCards = brand.whyChooseUs
    .map((w, i) => `<div class="fcard reveal ${["", "d1", "d2"][i % 3]}">${icon(i + 1)}<h3>${esc(w.title)}</h3><p>${esc(w.desc)}</p></div>`)
    .join("\n      ");

  const stats = brand.stats
    .map((s, i) => `<div class="stat reveal ${["", "d1", "d2", "d3"][i % 4]}"><div class="stat-v">${esc(s.value)}</div><div class="stat-l">${esc(s.label)}</div></div>`)
    .join("\n      ");

  const services = brand.b2bServices
    .map((s, i) => `<div class="fcard reveal ${["", "d1", "d2"][i % 3]}">${icon(i + 3)}<h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div>`)
    .join("\n      ");

  const steps = brand.processSteps
    .map((s, i) => `<div class="usecase reveal ${["", "d1", "d2"][i % 3]}"><span class="uc-num">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div></div>`)
    .join("\n      ");

  const industries = brand.industries.map((x) => `<span class="chip">${esc(x)}</span>`).join("");

  const itemList = {
    "@type": "ItemList",
    "@id": url + "#products",
    name: "สินค้าของ NTW Steel",
    itemListElement: GRID_ORDER.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/${s}.html`,
      name: bySlug[s].nameTh,
    })),
  };

  const graph = [orgNode, webSiteNode, webPageNode(url, SITE_NAME + " | ผู้ผลิตฟาสเทนเนอร์และงานเหล็ก B2B", brand.metaDescription), itemList, faqNode(url, brand.faq)];

  const body = `
  <section class="hero hero-steel hero-grid-bg">
    <div class="wrap">
      <span class="eyebrow reveal">${esc(brand.companyTagline)}</span>
      <h1 class="display reveal d1">${esc(brand.homeHeroHeadline)}</h1>
      <p class="lead reveal d2">${esc(brand.homeHeroSubhead)}</p>
      <div class="btn-row center reveal d2">
        <a class="btn btn-on-dark btn-lg" href="contact.html">ขอใบเสนอราคา</a>
        <a class="link-chevron" href="#products" style="color:#fff">ดูสินค้าทั้งหมด</a>
      </div>
    </div>
  </section>

  <section class="section-sm bg-dark" style="padding-top:0">
    <div class="wrap-wide">
      <div class="stats">
      ${stats}
      </div>
    </div>
  </section>

  <section class="section" id="products">
    <div class="wrap-wide">
      <div class="sec-head">
        <span class="eyebrow">สินค้าของเรา</span>
        <h2 class="headline">ฟาสเทนเนอร์และงานเหล็ก ครบในที่เดียว</h2>
        <p class="lead">ตั้งแต่แองเคอร์โบลท์ฐานราก ไปจนถึงงานสั่งผลิตพิเศษตามแบบ — ผลิตเอง คุมคุณภาพเอง</p>
      </div>
      <div class="grid grid-3">
      ${productCards}
      </div>
    </div>
  </section>

  <section class="section bg-alt">
    <div class="wrap-wide">
      <div class="sec-head">
        <span class="eyebrow">จุดแข็งของเรา</span>
        <h2 class="headline">ผลิตเอง คุมคุณภาพ ส่งตรงเวลา</h2>
        <p class="lead">${esc(brand.missionStatement)}</p>
      </div>
      <div class="grid grid-4">
      ${vprops}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap-wide">
      <div class="sec-head">
        <span class="eyebrow">ทำไมต้องเลือกเรา</span>
        <h2 class="headline">คู่ค้าฟาสเทนเนอร์ที่ธุรกิจไว้วางใจ</h2>
      </div>
      <div class="grid grid-3">
      ${whyCards}
      </div>
    </div>
  </section>

  <section class="section bg-dark">
    <div class="wrap-wide">
      <div class="sec-head">
        <span class="eyebrow">บริการสำหรับลูกค้าธุรกิจ</span>
        <h2 class="headline">ออกแบบมาเพื่องาน B2B</h2>
      </div>
      <div class="grid grid-3">
      ${services}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">ขั้นตอนการสั่งซื้อ</span>
        <h2 class="headline">สั่งงานกับเราง่ายใน 5 ขั้นตอน</h2>
      </div>
      <div class="grid grid-2">
      ${steps}
      </div>
    </div>
  </section>

  <section class="section-sm bg-alt">
    <div class="wrap center">
      <span class="eyebrow reveal">อุตสาหกรรมที่เราให้บริการ</span>
      <h2 class="headline reveal d1" style="margin:12px 0 24px">ครอบคลุมทุกงานโครงสร้างและอุตสาหกรรม</h2>
      <div class="chips reveal d2" style="justify-content:center;max-width:820px;margin:0 auto">${industries}</div>
    </div>
  </section>

  ${faqSection(brand.faq)}

  ${ctaBand("เริ่มต้นโครงการของคุณกับ NTW Steel", "ส่งรายการสินค้าหรือแบบงานมาให้เรา ทีมงานพร้อมช่วยเลือกสเปกและเสนอราคาโรงงานให้ทันที")}
  `;

  return page({
    slug: "index",
    title: `${SITE_NAME} | ผู้ผลิตฟาสเทนเนอร์ J-Bolt L-Bolt แผ่นเพลท สกรูน็อต สกรูการ์ดเรล`,
    description: brand.metaDescription,
    keywords: brand.keywords,
    canonicalPath: "",
    bodyClass: "",
    graph,
    body,
  });
}

/* ========================================================================== */
/* ABOUT PAGE                                                                  */
/* ========================================================================== */
function buildAbout() {
  const url = BASE + "/about.html";
  const paras = brand.aboutParagraphs.map((t, i) => `<p class="${i === 0 ? "lead" : "muted"}" style="margin-bottom:18px">${esc(t)}</p>`).join("\n        ");
  const why = brand.whyChooseUs.map((w, i) => `<div class="fcard reveal ${["", "d1", "d2"][i % 3]}">${icon(i)}<h3>${esc(w.title)}</h3><p>${esc(w.desc)}</p></div>`).join("\n      ");
  const stats = brand.stats.map((s, i) => `<div class="stat reveal ${["", "d1", "d2", "d3"][i % 4]}"><div class="stat-v">${esc(s.value)}</div><div class="stat-l">${esc(s.label)}</div></div>`).join("\n      ");
  const industries = brand.industries.map((x) => `<span class="chip">${esc(x)}</span>`).join("");

  const graph = [
    orgNode,
    webSiteNode,
    webPageNode(url, "เกี่ยวกับเรา | " + SITE_NAME, "เกี่ยวกับ " + SITE_NAME + " ผู้ผลิตและจำหน่ายฟาสเทนเนอร์และงานเหล็ก B2B"),
    breadcrumbNode([
      { name: "หน้าแรก", url: BASE + "/" },
      { name: "เกี่ยวกับเรา", url },
    ]),
  ];

  const body = `
  <nav class="wrap crumb" aria-label="breadcrumb"><a href="index.html">หน้าแรก</a><span>›</span>เกี่ยวกับเรา</nav>

  <section class="hero">
    <div class="wrap">
      <span class="eyebrow reveal">เกี่ยวกับ ${esc(SITE_NAME)}</span>
      <h1 class="display reveal d1">${esc(brand.aboutHeadline)}</h1>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div style="max-width:760px;margin:0 auto" class="reveal">
        ${paras}
      </div>
    </div>
  </section>

  <section class="section-sm bg-dark">
    <div class="wrap-wide"><div class="stats">${stats}</div></div>
  </section>

  <section class="section bg-alt">
    <div class="wrap-wide">
      <div class="sec-head"><span class="eyebrow">คุณค่าที่เราส่งมอบ</span><h2 class="headline">มาตรฐานที่คุณวางใจได้</h2></div>
      <div class="grid grid-3">${why}</div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap center">
      <span class="eyebrow reveal">อุตสาหกรรมที่เราให้บริการ</span>
      <h2 class="headline reveal d1" style="margin:12px 0 24px">พันธมิตรของทุกงานโครงสร้าง</h2>
      <div class="chips reveal d2" style="justify-content:center;max-width:820px;margin:0 auto">${industries}</div>
    </div>
  </section>

  ${ctaBand("อยากรู้ว่าเราช่วยงานคุณได้อย่างไร?", "ปรึกษาทีมเทคนิคของเราเรื่องการเลือกวัสดุ เกรด และการชุบผิว ให้เหมาะกับงานและงบประมาณ")}
  `;

  return page({
    slug: "about",
    title: "เกี่ยวกับเรา | " + SITE_NAME,
    description: "เกี่ยวกับ " + SITE_NAME + " — " + brand.aboutHeadline + " ผู้ผลิตและจำหน่ายฟาสเทนเนอร์และงานเหล็ก B2B ผลิตเอง คุมคุณภาพ จัดส่งทั่วประเทศ",
    keywords: brand.keywords,
    canonicalPath: "about.html",
    graph,
    body,
  });
}

/* ========================================================================== */
/* CONTACT PAGE                                                                */
/* ========================================================================== */
function buildContact() {
  const url = BASE + "/contact.html";
  const options = NAV_ORDER.map((s) => `<option value="${escAttr(bySlug[s].nameTh.split(" (")[0])}">${esc(bySlug[s].nameTh.split(" (")[0])}</option>`).join("");

  const graph = [
    orgNode,
    webSiteNode,
    {
      "@type": "ContactPage",
      "@id": url + "#webpage",
      url,
      name: "ติดต่อเรา | " + SITE_NAME,
      inLanguage: "th-TH",
      isPartOf: { "@id": BASE + "/#website" },
      about: { "@id": BASE + "/#organization" },
    },
    breadcrumbNode([
      { name: "หน้าแรก", url: BASE + "/" },
      { name: "ติดต่อเรา", url },
    ]),
  ];

  const body = `
  <nav class="wrap crumb" aria-label="breadcrumb"><a href="index.html">หน้าแรก</a><span>›</span>ติดต่อเรา</nav>

  <section class="hero" style="padding-bottom:40px">
    <div class="wrap">
      <span class="eyebrow reveal">ติดต่อฝ่ายขาย</span>
      <h1 class="display reveal d1">ขอใบเสนอราคา</h1>
      <p class="lead reveal d2">ส่งความต้องการหรือแบบงานมาให้เรา ทีมงานตอบกลับพร้อมราคาโรงงานภายใน 24 ชั่วโมงทำการ</p>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="split" style="align-items:start">
        <div class="reveal">
          <h2 class="subhead" style="margin-bottom:24px">ช่องทางติดต่อ</h2>
          <div class="contact-line"><span class="ci">✆</span><div><b>โทรศัพท์</b><a href="tel:${escAttr(CONTACT.phone.replace(/[^0-9+]/g, ""))}">${esc(CONTACT.phone)}</a> · <a href="tel:${escAttr(CONTACT.mobile.replace(/[^0-9+]/g, ""))}">${esc(CONTACT.mobile)}</a></div></div>
          <div class="contact-line"><span class="ci">✉</span><div><b>อีเมล</b><a href="mailto:${escAttr(CONTACT.email)}">${esc(CONTACT.email)}</a></div></div>
          <div class="contact-line"><span class="ci">◍</span><div><b>LINE Official</b>${esc(CONTACT.line)}</div></div>
          <div class="contact-line"><span class="ci">⌂</span><div><b>ที่อยู่</b>${CONTACT.addr.map(esc).join("<br>")}</div></div>
          <div class="contact-line"><span class="ci">◷</span><div><b>เวลาทำการ</b>${esc(CONTACT.hours)}</div></div>
        </div>

        <div class="fcard reveal d1" style="padding:32px">
          <h2 class="subhead" style="margin-bottom:8px">แบบฟอร์มขอใบเสนอราคา</h2>
          <p class="muted" style="margin-bottom:22px">กรอกรายละเอียด แล้วเราจะติดต่อกลับพร้อมใบเสนอราคา</p>
          <p id="form-ok" hidden style="background:#e7f7ec;border:1px solid #b6e2c4;color:#1a7f43;padding:12px 16px;border-radius:12px;margin-bottom:18px">✓ ได้รับข้อมูลแล้ว ทีมงานจะติดต่อกลับโดยเร็ว (เดโม่ — ยังไม่ได้เชื่อมต่อระบบส่งอีเมล)</p>
          <form id="quote-form" class="form-grid" novalidate>
            <div class="field"><label for="f-name">ชื่อผู้ติดต่อ *</label><input id="f-name" name="name" required autocomplete="name"></div>
            <div class="field"><label for="f-company">บริษัท</label><input id="f-company" name="company" autocomplete="organization"></div>
            <div class="field"><label for="f-phone">เบอร์โทร *</label><input id="f-phone" name="phone" type="tel" required autocomplete="tel"></div>
            <div class="field"><label for="f-email">อีเมล</label><input id="f-email" name="email" type="email" autocomplete="email"></div>
            <div class="field"><label for="f-product">สินค้าที่สนใจ</label><select id="f-product" name="product"><option value="">— เลือกสินค้า —</option>${options}<option value="อื่น ๆ">อื่น ๆ / งานสั่งผลิต</option></select></div>
            <div class="field"><label for="f-qty">จำนวน / ปริมาณ</label><input id="f-qty" name="qty" placeholder="เช่น 500 ตัว, M16x300"></div>
            <div class="field full"><label for="f-msg">รายละเอียดงาน / สเปก *</label><textarea id="f-msg" name="message" required placeholder="ระบุขนาด เกรดวัสดุ การชุบผิว มาตรฐาน และกำหนดส่ง หากมีแบบ (drawing) แนบมาได้เลย"></textarea></div>
            <div class="field full"><button class="btn btn-primary btn-lg" type="submit">ส่งขอใบเสนอราคา</button></div>
          </form>
        </div>
      </div>
    </div>
  </section>
  `;

  return page({
    slug: "contact",
    title: "ติดต่อเรา / ขอใบเสนอราคา | " + SITE_NAME,
    description: "ติดต่อ " + SITE_NAME + " ขอใบเสนอราคาฟาสเทนเนอร์ J-bolt L-bolt แผ่นเพลท สกรูน็อต สกรูการ์ดเรล และงานสั่งผลิตพิเศษ ราคาโรงงาน จัดส่งทั่วประเทศ โทร " + CONTACT.phone,
    keywords: ["ติดต่อ NTW Steel", "ขอใบเสนอราคาน็อตสกรู", "โรงงานฟาสเทนเนอร์", "สั่งผลิต anchor bolt"],
    canonicalPath: "contact.html",
    graph,
    body,
  });
}

/* ========================================================================== */
/* write                                                                      */
/* ========================================================================== */
function out(name, html) {
  fs.writeFileSync(path.join(ROOT, name), html, "utf8");
  console.log("  ✓", name, "(" + Math.round(html.length / 1024) + " KB)");
}

console.log("Building NTW Steel site…");
out("index.html", buildIndex());
products.forEach((p) => out(p.slug + ".html", buildProduct(p)));
out("about.html", buildAbout());
out("contact.html", buildContact());
console.log("Done. Pages:", 3 + products.length);
