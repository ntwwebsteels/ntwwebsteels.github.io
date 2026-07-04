# NTW Steel — เว็บไซต์ B2B (Apple-inspired)

เว็บไซต์บริษัทสำหรับ **NTW Steel** ผู้ผลิตและจำหน่ายฟาสเทนเนอร์และงานเหล็ก แบบ B2B
ดีไซน์แรงบันดาลใจจาก apple.com — สะอาด คมชัด โหลดเร็ว รองรับ **SEO / AEO / GEO** เต็มรูปแบบ

โลโก้เป็นตัวอักษรคม ๆ **NTWSteeL** (NTW หนา + SteeL บาง)

## หน้าเว็บ (9 หน้า)
| ไฟล์ | เนื้อหา |
|---|---|
| `index.html` | หน้าแรก (hero, สินค้า, จุดแข็ง, บริการ B2B, ขั้นตอนสั่งซื้อ, FAQ) |
| `j-bolt.html` | เจ-โบลท์ (J-Bolt) |
| `l-bolt.html` | แอล-โบลท์ (L-Bolt) |
| `plate.html` | แผ่นเพลท / เบสเพลท |
| `screw-nut.html` | สกรูน็อต |
| `custom.html` | งานสั่งผลิตพิเศษ (OEM) |
| `guardrail-screw.html` | **สกรูการ์ดเรล — หน้าพิเศษ** (เนื้อหาลึกเป็นพิเศษ, hero สีเข้ม) |
| `about.html` | เกี่ยวกับเรา |
| `contact.html` | ติดต่อ / ขอใบเสนอราคา (มีฟอร์ม) |

## โครงสร้างไฟล์
```
ntw/
├─ *.html              ← หน้าเว็บ (สร้างจาก build.js)
├─ assets/
│  ├─ styles.css       ← ดีไซน์ระบบทั้งหมด
│  ├─ app.js           ← เมนูมือถือ, scroll reveal, ฟอร์ม
│  ├─ logo.svg / favicon.svg / og-cover.svg
├─ data/content.json   ← เนื้อหาต้นฉบับ (แก้แล้ว build ใหม่ได้)
├─ build.js            ← สคริปต์สร้างหน้าเว็บ (node build.js)
├─ sitemap.xml, robots.txt
```

## การแก้ไข / สร้างใหม่
เนื้อหาทั้งหมดอยู่ใน `data/content.json` — แก้แล้วรัน:
```
node build.js
```
ระบบจะ generate หน้า HTML ทั้งหมดใหม่พร้อม JSON-LD

ตั้งค่าหลัก (โดเมน, เบอร์โทร, ที่อยู่) แก้ที่ส่วนบนของ `build.js`:
- `BASE` = โดเมนจริง (ตอนนี้เป็น `https://www.ntwsteel.co.th` — ตัวอย่าง)
- `CONTACT` = เบอร์โทร / อีเมล / LINE / ที่อยู่ (ตอนนี้เป็น placeholder เช่น `02-XXX-XXXX`)

## ⚠️ สิ่งที่ต้องแก้ก่อนขึ้นจริง (พี่ที verify)
1. **รูปภาพ** — ตอนนี้เป็นลิงก์ชั่วคราวจาก Wikimedia Commons (ต่างประเทศ, ฟรี). ลิงก์ทุกรูปทดสอบแล้วโหลดได้จริง แต่แนะนำให้เปลี่ยนเป็นรูปสินค้าจริงของพี่ — แก้ที่ฟิลด์ `images[].url` ใน `data/content.json` แล้ว `node build.js`
   - ถ้ารูปโหลดไม่ได้ เว็บจะแสดงพื้นหลังไล่สีเหล็กสวย ๆ แทนอัตโนมัติ (ไม่พัง)
2. **ข้อมูลติดต่อ** — เบอร์/อีเมล/LINE/ที่อยู่ ยังเป็น placeholder (`02-XXX-XXXX`, `sales@ntwsteel.co.th`, `@ntwsteel`, ที่อยู่ `————`)
3. **โดเมน** — เปลี่ยน `BASE` ให้ตรงโดเมนจริง (มีผลกับ canonical, OG, sitemap, JSON-LD)
4. **ฟอร์มขอใบเสนอราคา** — ตอนนี้เป็นเดโม่ (ยังไม่ส่งอีเมลจริง) ต้องต่อ backend / Formspree / Google Form
5. **สถิติ** (15+ ปี, 1,000+ SKU ฯลฯ) — เป็นค่าประมาณ ปรับให้ตรงจริง
6. **ตัวเลขสเปกทางเทคนิค** — AI สร้างตามมาตรฐานสากลจริง (ASTM, DIN, JIS, มอก.) แต่ควรให้ฝ่ายเทคนิคตรวจทานก่อนเผยแพร่

## SEO / AEO / GEO ที่ทำไว้ให้
- **SEO**: title/meta/keywords รายหน้า, canonical, Open Graph, Twitter Card, sitemap.xml, semantic HTML, mobile-first, โหลดเร็ว
- **AEO** (Answer Engine): FAQ ทุกหน้า + `FAQPage` structured data (Google หยิบไปทำ rich result / featured snippet ได้)
- **GEO** (Generative Engine): `robots.txt` อนุญาต GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot ฯลฯ + เนื้อหาเป็นข้อเท็จจริงมีตัวเลข/มาตรฐานชัดเจน ให้ AI อ้างอิงได้
- **Structured data (JSON-LD)**: Organization, WebSite, Product (+ additionalProperty สเปก), Offer, FAQPage, BreadcrumbList, ItemList, ContactPage

## Deploy
เป็น static site ล้วน — อัปโหลดโฟลเดอร์นี้ขึ้น host ใดก็ได้ (Netlify, Vercel, Cloudflare Pages, GitHub Pages, hosting ทั่วไป) โดยไม่ต้องมี server

### 🟢 ตอนนี้ Live อยู่ที่ GitHub Pages
- **URL:** https://ntwwebsteels.github.io/
- **Repo:** https://github.com/ntwwebsteels/ntwwebsteels.github.io (public, serve จาก branch `main` root)

### อัปเดตเว็บ (หลังแก้เนื้อหา/ข้อมูลติดต่อ)
```
node build.js              # ถ้าแก้ data/content.json หรือ build.js
git add -A
git commit -m "update content"
git push
```
รอ ~1-2 นาที GitHub Pages จะ rebuild แล้วอัปเดตอัตโนมัติ

> หมายเหตุ: `BASE` ใน build.js ยังชี้ไป `https://www.ntwsteel.co.th` (โดเมนจริงในอนาคต) — มีผลกับ canonical/OG/sitemap เท่านั้น ไม่กระทบการแสดงผลบน github.io ตอนย้ายไปโดเมนจริงค่อยเปลี่ยน `BASE` แล้ว build ใหม่
