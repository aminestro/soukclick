import { PrismaClient, AdminRole, ProductStatus, TestingStatus, LandingPageTemplate } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ─── Cities ───────────────────────────────────────────────────────────────────
// delivery_price in centimes (MAD × 100)
// wilaya_code: "01"–"12" mapped to Morocco's 12 regions

const cities = [
  // Region 01 — Tanger-Tétouan-Al Hoceïma
  { nameFr: "Tanger",      nameAr: "طنجة",           wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Tétouan",     nameAr: "تطوان",           wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Al Hoceïma",  nameAr: "الحسيمة",         wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },
  { nameFr: "Chefchaouen", nameAr: "شفشاون",           wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },
  { nameFr: "Larache",     nameAr: "العرائش",          wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Asilah",      nameAr: "أصيلة",           wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Fnideq",      nameAr: "الفنيدق",          wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "M'diq",       nameAr: "مديق",             wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Martil",      nameAr: "مارتيل",           wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Ouezzane",    nameAr: "وزان",             wilaya: "Tanger-Tétouan-Al Hoceïma",        wilayaCode: "01", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },

  // Region 02 — Oriental
  { nameFr: "Oujda",       nameAr: "وجدة",             wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Nador",       nameAr: "الناظور",           wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Berkane",     nameAr: "بركان",             wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Taourirt",    nameAr: "تاوريرت",           wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },
  { nameFr: "Jerada",      nameAr: "جرادة",             wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 3500, deliveryDays: 4, isRemote: false },
  { nameFr: "Driouch",     nameAr: "دريوش",             wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 3500, deliveryDays: 4, isRemote: false },
  { nameFr: "Figuig",      nameAr: "فكيك",              wilaya: "Oriental",                          wilayaCode: "02", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },

  // Region 03 — Fès-Meknès
  { nameFr: "Fès",         nameAr: "فاس",              wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Meknès",      nameAr: "مكناس",             wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Taza",        nameAr: "تازة",              wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Azrou",       nameAr: "أزرو",              wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Ifrane",      nameAr: "إفران",             wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Sefrou",      nameAr: "صفرو",              wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Boulemane",   nameAr: "بولمان",             wilaya: "Fès-Meknès",                        wilayaCode: "03", deliveryPrice: 3500, deliveryDays: 4, isRemote: false },

  // Region 04 — Rabat-Salé-Kénitra
  { nameFr: "Rabat",       nameAr: "الرباط",            wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Salé",        nameAr: "سلا",               wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Témara",      nameAr: "تمارة",             wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Kenitra",     nameAr: "القنيطرة",           wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Khémisset",   nameAr: "الخميسات",           wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Sidi Kacem",  nameAr: "سيدي قاسم",          wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Tiflet",      nameAr: "تيفلت",             wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Souk El Arbaa", nameAr: "سوق الأربعاء",    wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Skhirate",    nameAr: "الصخيرات",           wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Ain Attig",   nameAr: "عين عتيق",           wilaya: "Rabat-Salé-Kénitra",                wilayaCode: "04", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },

  // Region 05 — Béni Mellal-Khénifra
  { nameFr: "Beni Mellal", nameAr: "بني ملال",           wilaya: "Béni Mellal-Khénifra",              wilayaCode: "05", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Khouribga",   nameAr: "خريبكة",             wilaya: "Béni Mellal-Khénifra",              wilayaCode: "05", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Khenifra",    nameAr: "خنيفرة",             wilaya: "Béni Mellal-Khénifra",              wilayaCode: "05", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },
  { nameFr: "Azilal",      nameAr: "أزيلال",             wilaya: "Béni Mellal-Khénifra",              wilayaCode: "05", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },
  { nameFr: "Fquih Ben Salah", nameAr: "الفقيه بن صالح", wilaya: "Béni Mellal-Khénifra",             wilayaCode: "05", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Oued Zem",    nameAr: "واد زم",             wilaya: "Béni Mellal-Khénifra",              wilayaCode: "05", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },

  // Region 06 — Casablanca-Settat
  { nameFr: "Casablanca",  nameAr: "الدار البيضاء",      wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Mohammédia",  nameAr: "المحمدية",            wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "El Jadida",   nameAr: "الجديدة",             wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Settat",      nameAr: "سطات",               wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Berrechid",   nameAr: "برشيد",               wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Ben Slimane", nameAr: "بن سليمان",           wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Médiouna",    nameAr: "مديونة",              wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Bouskoura",   nameAr: "بوسكورة",             wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },
  { nameFr: "Had Soualem", nameAr: "حد السوالم",          wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Nouaceur",    nameAr: "النواصر",             wilaya: "Casablanca-Settat",                 wilayaCode: "06", deliveryPrice: 2500, deliveryDays: 1, isRemote: false },

  // Region 07 — Marrakech-Safi
  { nameFr: "Marrakech",   nameAr: "مراكش",               wilaya: "Marrakech-Safi",                    wilayaCode: "07", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Safi",        nameAr: "آسفي",                wilaya: "Marrakech-Safi",                    wilayaCode: "07", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },
  { nameFr: "Essaouira",   nameAr: "الصويرة",              wilaya: "Marrakech-Safi",                    wilayaCode: "07", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },
  { nameFr: "Kalaat Sraghna", nameAr: "قلعة السراغنة",    wilaya: "Marrakech-Safi",                    wilayaCode: "07", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Youssoufia",  nameAr: "اليوسفية",             wilaya: "Marrakech-Safi",                    wilayaCode: "07", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Ben Guerir",  nameAr: "بن جرير",             wilaya: "Marrakech-Safi",                    wilayaCode: "07", deliveryPrice: 3000, deliveryDays: 2, isRemote: false },

  // Region 08 — Drâa-Tafilalet
  { nameFr: "Ouarzazate",  nameAr: "ورزازات",             wilaya: "Drâa-Tafilalet",                    wilayaCode: "08", deliveryPrice: 4000, deliveryDays: 4, isRemote: false },
  { nameFr: "Errachidia",  nameAr: "الرشيدية",             wilaya: "Drâa-Tafilalet",                    wilayaCode: "08", deliveryPrice: 4000, deliveryDays: 4, isRemote: false },
  { nameFr: "Zagora",      nameAr: "زاكورة",               wilaya: "Drâa-Tafilalet",                    wilayaCode: "08", deliveryPrice: 4500, deliveryDays: 4, isRemote: true  },
  { nameFr: "Tinghir",     nameAr: "تنغير",                wilaya: "Drâa-Tafilalet",                    wilayaCode: "08", deliveryPrice: 4000, deliveryDays: 4, isRemote: false },
  { nameFr: "Midelt",      nameAr: "ميدلت",                wilaya: "Drâa-Tafilalet",                    wilayaCode: "08", deliveryPrice: 4000, deliveryDays: 4, isRemote: false },
  { nameFr: "Rich",        nameAr: "الريش",                wilaya: "Drâa-Tafilalet",                    wilayaCode: "08", deliveryPrice: 4500, deliveryDays: 5, isRemote: true  },

  // Region 09 — Souss-Massa
  { nameFr: "Agadir",      nameAr: "أكادير",               wilaya: "Souss-Massa",                       wilayaCode: "09", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Inezgane",    nameAr: "إنزكان",               wilaya: "Souss-Massa",                       wilayaCode: "09", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Ait Melloul", nameAr: "أيت ملول",             wilaya: "Souss-Massa",                       wilayaCode: "09", deliveryPrice: 2500, deliveryDays: 2, isRemote: false },
  { nameFr: "Taroudant",   nameAr: "تارودانت",              wilaya: "Souss-Massa",                       wilayaCode: "09", deliveryPrice: 3000, deliveryDays: 3, isRemote: false },
  { nameFr: "Tiznit",      nameAr: "تيزنيت",               wilaya: "Souss-Massa",                       wilayaCode: "09", deliveryPrice: 3500, deliveryDays: 3, isRemote: false },

  // Region 10 — Guelmim-Oued Noun
  { nameFr: "Guelmim",     nameAr: "كلميم",                wilaya: "Guelmim-Oued Noun",                 wilayaCode: "10", deliveryPrice: 4500, deliveryDays: 4, isRemote: true  },
  { nameFr: "Tan-Tan",     nameAr: "طانطان",               wilaya: "Guelmim-Oued Noun",                 wilayaCode: "10", deliveryPrice: 4500, deliveryDays: 4, isRemote: true  },
  { nameFr: "Assa",        nameAr: "أسا",                  wilaya: "Guelmim-Oued Noun",                 wilayaCode: "10", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },

  // Region 11 — Laâyoune-Sakia El Hamra
  { nameFr: "Laâyoune",    nameAr: "العيون",               wilaya: "Laâyoune-Sakia El Hamra",           wilayaCode: "11", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },
  { nameFr: "Smara",       nameAr: "السمارة",               wilaya: "Laâyoune-Sakia El Hamra",           wilayaCode: "11", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },
  { nameFr: "Boujdour",    nameAr: "بوجدور",               wilaya: "Laâyoune-Sakia El Hamra",           wilayaCode: "11", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },
  { nameFr: "Tarfaya",     nameAr: "طرفاية",               wilaya: "Laâyoune-Sakia El Hamra",           wilayaCode: "11", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },

  // Region 12 — Dakhla-Oued Ed-Dahab
  { nameFr: "Dakhla",      nameAr: "الداخلة",              wilaya: "Dakhla-Oued Ed-Dahab",              wilayaCode: "12", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },
  { nameFr: "Aousserd",    nameAr: "أوسرد",                wilaya: "Dakhla-Oued Ed-Dahab",              wilayaCode: "12", deliveryPrice: 5000, deliveryDays: 5, isRemote: true  },
]

// ─── Delivery Companies ───────────────────────────────────────────────────────

const deliveryCompanies = [
  { name: "Amana",          slug: "amana",          exportFormat: "CSV"   as const },
  { name: "Ozon",           slug: "ozon",           exportFormat: "CSV"   as const },
  { name: "Express Relais", slug: "express-relais", exportFormat: "CSV"   as const },
  { name: "Cash Plus",      slug: "cash-plus",      exportFormat: "EXCEL" as const },
  { name: "Jibli",          slug: "jibli",          exportFormat: "CSV"   as const },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Starting SoukClick seed...\n")

  // 1. Cities
  console.log(`  → Seeding ${cities.length} cities...`)
  for (const city of cities) {
    await prisma.city.upsert({
      where:  { nameFr: city.nameFr },
      update: city,
      create: city,
    })
  }
  console.log(`     ✓ ${cities.length} cities done.\n`)

  // 2. Delivery companies
  console.log("  → Seeding delivery companies...")
  for (const company of deliveryCompanies) {
    await prisma.deliveryCompany.upsert({
      where:  { slug: company.slug },
      update: company,
      create: company,
    })
  }
  console.log(`     ✓ ${deliveryCompanies.length} companies done.\n`)

  // 3. Test product
  console.log("  → Seeding test product...")
  const product = await prisma.product.upsert({
    where:  { slug: "test-gadget" },
    update: {},
    create: {
      slug:          "test-gadget",
      titleFr:       "Gadget Test — SoukClick",
      titleAr:       "جادجيت تجريبي",
      descriptionFr: "Produit de test pour valider le pipeline SoukClick. À supprimer avant la mise en production.",
      price:         29900,   // 299 MAD
      costPrice:     8000,    // 80 MAD
      comparePrice:  49900,   // 499 MAD
      stock:         100,
      status:        ProductStatus.ACTIVE,
      testingStatus: TestingStatus.TESTING,
      images:        [
        "https://placehold.co/800x800/1e293b/94a3b8?text=SoukClick+Test",
      ],
    },
  })
  console.log(`     ✓ Product "${product.titleFr}" (${product.slug}) done.\n`)

  // 4. Default landing page for test product
  console.log("  → Seeding test landing page...")
  await prisma.landingPage.upsert({
    where:  { slug: "test-gadget" },
    update: {},
    create: {
      productId: product.id,
      slug:      "test-gadget",
      template:  LandingPageTemplate.GADGET_DEMO,
      isActive:  true,
      metaTitle: "Gadget Test — SoukClick",
      metaDesc:  "Découvrez le gadget test SoukClick. Livraison partout au Maroc.",
      sections:  [
        {
          type:    "hero",
          enabled: true,
          order:   1,
          data: {
            headline:         "Le gadget qui change tout",
            subheadline:      "Livraison rapide partout au Maroc — Paiement à la livraison",
            image_url:        "https://placehold.co/800x800/1e293b/94a3b8?text=Produit",
            video_url:        null,
            cta_text:         "Commander Maintenant",
            cta_color:        "#f97316",
            show_price:       true,
            show_compare_price: true,
            badges:           ["cod", "livraison_gratuite", "garantie"],
          },
        },
        {
          type:    "benefits",
          enabled: true,
          order:   2,
          data: {
            title: "Pourquoi choisir ce produit ?",
            items: [
              { icon: "⚡", title: "Rapide",    description: "Résultats visibles dès la première utilisation." },
              { icon: "✅", title: "Fiable",    description: "Testé et approuvé par des milliers de clients." },
              { icon: "🚚", title: "Livraison", description: "Partout au Maroc en 24-72h." },
            ],
          },
        },
        {
          type:    "reviews",
          enabled: true,
          order:   3,
          data: {
            title:      "Ce que disent nos clients",
            review_ids: [],
          },
        },
        {
          type:    "faq",
          enabled: true,
          order:   4,
          data: {
            title: "Questions fréquentes",
            items: [
              { question: "Comment passer une commande ?",        answer: "Remplissez le formulaire et notre équipe vous contacte sous 24h." },
              { question: "Quels sont les délais de livraison ?", answer: "1 à 5 jours selon votre ville." },
              { question: "Comment fonctionne le paiement ?",     answer: "Vous payez uniquement à la réception de votre commande." },
            ],
          },
        },
        {
          type:    "cta",
          enabled: true,
          order:   5,
          data: {
            headline:     "Commandez maintenant — Stock limité !",
            cta_text:     "Je Commande",
            cta_color:    "#f97316",
            urgency_text: "⚠️ Il ne reste que quelques unités disponibles.",
          },
        },
      ],
    },
  })
  console.log("     ✓ Landing page done.\n")

  // 5. Default offers for test product
  console.log("  → Seeding test offers...")
  const existingOffers = await prisma.offer.findMany({ where: { productId: product.id } })
  if (existingOffers.length === 0) {
    await prisma.offer.createMany({
      data: [
        {
          productId:       product.id,
          type:            "QUANTITY_DISCOUNT",
          labelFr:         "1 unité",
          labelAr:         "قطعة واحدة",
          minQuantity:     1,
          discountPercent: 0,
          freeShipping:    false,
          isActive:        true,
        },
        {
          productId:       product.id,
          type:            "QUANTITY_DISCOUNT",
          labelFr:         "2 unités — économisez 10%",
          labelAr:         "قطعتان — وفر 10%",
          minQuantity:     2,
          discountPercent: 10,
          freeShipping:    false,
          isActive:        true,
        },
        {
          productId:       product.id,
          type:            "FREE_SHIPPING",
          labelFr:         "3 unités — Livraison Gratuite",
          labelAr:         "3 قطع — توصيل مجاني",
          minQuantity:     3,
          discountPercent: 10,
          freeShipping:    true,
          isActive:        true,
        },
      ],
    })
  }
  console.log("     ✓ Offers done.\n")

  // 6. Admin user
  console.log("  → Seeding admin user...")
  const passwordHash = await bcrypt.hash("admin123", 12)
  await prisma.admin.upsert({
    where:  { email: "admin@soukclick.store" },
    update: {},
    create: {
      email:    "admin@soukclick.store",
      password: passwordHash,
      name:     "Super Admin",
      role:     AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  })
  console.log("     ✓ Admin done.\n")

  // 7. Sample reviews for test product
  console.log("  → Seeding sample reviews...")
  const existingReviews = await prisma.review.findMany({ where: { productId: product.id } })
  if (existingReviews.length === 0) {
    await prisma.review.createMany({
      data: [
        {
          productId:  product.id,
          authorName: "Fatima Z.",
          authorCity: "Casablanca",
          rating:     5,
          content:    "Produit excellent ! Je suis très satisfaite de ma commande. Livraison rapide et emballage soigné.",
          isVerified: true,
          sortOrder:  1,
          isActive:   true,
        },
        {
          productId:  product.id,
          authorName: "Mohamed A.",
          authorCity: "Marrakech",
          rating:     5,
          content:    "Qualité top ! Je recommande à tous mes amis. Le service client est aussi très réactif.",
          isVerified: true,
          sortOrder:  2,
          isActive:   true,
        },
        {
          productId:  product.id,
          authorName: "Khadija B.",
          authorCity: "Rabat",
          rating:     4,
          content:    "Très bon produit, conforme à la description. Livré en 2 jours seulement.",
          isVerified: false,
          sortOrder:  3,
          isActive:   true,
        },
      ],
    })
  }
  console.log("     ✓ Reviews done.\n")

  console.log("✅  Seed complete!\n")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  Admin login:")
  console.log("    Email:    admin@soukclick.store")
  console.log("    Password: admin123")
  console.log("  Landing page: /test-gadget")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
