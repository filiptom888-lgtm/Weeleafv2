// Orbit geometry constants
export const ORBIT_RADIUS = 5.2
export const ORBIT_HEIGHT = -0.9

/**
 * Each coin has:
 *  id, label, subtitle, color (hex), emissiveColor (hex),
 *  angle (degrees, starting position on orbit ring),
 *  content: { title, tagline, sections[] }
 *
 * Section types (all optional except heading):
 *  heading (string), text (string), items ({name,desc,link?}[]),
 *  socials ({platform,handle,url,color}[]),
 *  link ({text,url}), cta ({text,email})
 */
export const COINS = [
  /* ─────────────────────── 1. WL CORE ─────────────────────── */
  {
    id: 'wl-core',
    label: 'WL',
    subtitle: 'The Core',
    color: '#4ade80',
    emissiveColor: '#22c55e',
    angle: 0, // 8 nodes evenly spaced at i/8 * 360
    content: {
      title: 'WL — Et levende fællesskab',
      tagline: 'For mennesker, idéer og bæredygtig fremtid',
      sections: [
        {
          heading: '🌿 Hvad er WL?',
          text: 'WL er et åbent, voksende univers skabt til mennesker, der vil mere end bare følge med tiden — de vil forme den. Her mødes teknologi, natur, kreativitet og fællesskab i et rum, hvor alle kan bidrage, lære og bygge noget, der rækker længere end os selv.\n\nWL er ikke et brand i klassisk forstand. Det er en bevægelse. Et sted hvor idéer spirer, hvor mennesker hjælper hinanden frem, og hvor vi sammen udvikler løsninger, der gør hverdagen enklere, smukkere og mere bæredygtig.',
        },
        {
          heading: '🌱 Hvad vi bygger',
          items: [
            {
              name: 'Fællesskab',
              desc: 'Et fællesskab, hvor alle kan være med — uanset erfaring, baggrund eller faglighed.',
            },
            {
              name: 'Digitalt økosystem',
              desc: 'Et digitalt økosystem, hvor teknologi bruges til at styrke menneskelig kreativitet og samarbejde.',
            },
            {
              name: 'Bæredygtige produkter',
              desc: 'Produkter og projekter, der tager udgangspunkt i naturens materialer og fremtidens behov.',
            },
            {
              name: 'Platform for læring',
              desc: 'En platform, hvor du kan dele viden, finde sparring og skabe nye muligheder.',
            },
          ],
        },
        {
          heading: '🌍 Vores tilgang',
          text: 'WL arbejder ud fra en enkel filosofi: Når mennesker får plads til at skabe, vokser både fællesskabet og verden omkring os. Derfor designer vi alt — fra kontrakter til digitale oplevelser — med fokus på:',
          items: [
            { name: 'Klarhed', desc: 'Gennemsigtighed i alt hvad vi gør.' },
            { name: 'Tilgængelighed', desc: 'Åbent for alle, uanset udgangspunkt.' },
            { name: 'Samarbejde', desc: 'Vi bygger bedre sammen.' },
            { name: 'Langtidsholdbarhed', desc: 'Beslutninger der holder over tid.' },
            { name: 'Ægte menneskelig værdi', desc: 'Mennesket i centrum — altid.' },
          ],
        },
        {
          heading: '🤝 Vær med til at forme WL',
          text: 'WL er skabt til at blive bygget i fællesskab. Du kan deltage som skaber, udvikler, designer, nysgerrig nybegynder eller bare som dig selv. Det vigtigste er ikke, hvad du kan — men at du har lyst til at være med.\n\nWL er et sted, hvor alle bidrag tæller. Hvor idéer får lov at leve. Hvor vi sammen skaber noget, der gør en forskel.',
        },
      ],
    },
  },

  /* ─────────────────────── 2. HEMPTATION ─────────────────────── */
  {
    id: 'hemptation',
    label: 'Hemp',
    subtitle: 'Hemptation',
    color: '#86efac',
    emissiveColor: '#4ade80',
    angle: 45,
    content: {
      title: 'Hemptation',
      tagline: 'Hamp — en helt naturlig del',
      sections: [
        {
          heading: '🌿 Hvorfor hamp?',
          text: 'Hamp lyder i manges øre som noget skidt og forbinder det med en ulovlig plante. I WL ser vi det som planetens eget bæredygtige valg til en grønnere omstilling. Vi ved at hamp er en af de mest effektive afgrøder i moderne landbrug.',
          items: [
            { name: 'Hurtig vækst', desc: 'Producerer store mængder biomasse på kort tid.' },
            { name: 'Ingen pesticider', desc: 'Kræver ingen pesticider og er skånsom mod naturen.' },
            { name: 'CO₂-optag', desc: 'Optager store mængder CO₂ under vækst.' },
            { name: 'Jordforbedring', desc: 'Rødder skaber jordforbedring og øger biodiversitet.' },
            { name: 'Alsidighed', desc: 'Kan bruges til emballering, hygiejne, byggematerialer, tekstiler, papir og meget mere.' },
          ],
        },
        {
          heading: '🧴 Hemptation Wholesome — Pleje & Velvære',
          text: 'Hemptation er en serie af moderne plejeprodukter, skabt med fokus på renhed, kvalitet og ansvarlighed. Udviklet til dig, der ønsker effektiv hud- og hårpleje uden unødvendige eller skadelige ingredienser — og med respekt for både kroppen og miljøet.\n\nAlle Hemptation-produkter er fri for parabener, sulfater, silikoner, kunstige farvestoffer og unødvendige tilsætningsstoffer. Kernen er hamp — rig på omega-3, omega-6, antioxidanter og vitaminer, der styrker hudens naturlige barriere og giver en sund, naturlig glød.\n\nProdukterne er 100 % veganske og ikke testet på dyr.',
        },
        {
          heading: '🏷️ WL — Vores eget kvalitetsmærke',
          text: 'På vores produkter vil du ikke se logoer du normalt forbinder med gode certificerede produkter. I WL er vores logo sit eget mærke på, at vi understøtter alle de andre certificeringer. Alle produkter støtter WLs nuværende certificeringer.\n\nDerfor er WL et mærke du kan stole på.',
        },
        {
          heading: '🛏️ Hemptation Harmony & Wellness — Tekstiler',
          text: 'Hampetekstiler repræsenterer en ny standard inden for bæredygtige og ansvarligt producerede tekstilprodukter. Fremstillet af 100 % naturlige hampfibre kombinerer disse produkter høj kvalitet, funktionalitet og miljøhensyn i én løsning.\n\nCertificeret med OEKO-TEX, BSCI, SEDEX og FCA. Hampens naturlige egenskaber gør vores tekstiler antibakterielle, allergivenlige og temperaturregulerende — du sover sundt og komfortabelt året rundt.\n\nVores hampprodukter er slidstærke, bliver blødere med tiden og er produceret under etisk forsvarlige forhold.',
        },
      ],
    },
  },

  /* ─────────────────────── 3. WL HIVE ─────────────────────── */
  {
    id: 'wl-hive',
    label: 'Hive',
    subtitle: 'WL Hive',
    color: '#fbbf24',
    emissiveColor: '#f59e0b',
    angle: 90,
    content: {
      title: 'WL Hive',
      tagline: 'Fremtidens bolig — bygget i dag',
      sections: [
        {
          heading: '🏠 Hvad er WL Hive?',
          text: 'WL Hive er en fremtidens boligmodel og smarthome baseret på selvforsyning, cirkulær økonomi, fællesskab og kunstig intelligens. Husene producerer energi, fødevarer og ressourcer lokalt og automatisk — og fungerer som en del af et nytænkende netværk af bæredygtige fællesskaber.',
        },
        {
          heading: '⚡ Selvforsyning & Energi',
          items: [
            { name: 'Solenergi', desc: 'Integrerede solpaneler producerer mere energi end boligen forbruger.' },
            { name: 'Energilagring', desc: 'Lokale batterisystemer sikrer forsyning dag og nat, uanset vejret.' },
            { name: 'Vandhåndtering', desc: 'Genbrug af gråvand og regnvandsopsamling minimerer vandforbrug.' },
            { name: 'Fødevareproduktion', desc: 'Integrerede vertikale haver og akvaponik giver mad direkte fra hjemmet.' },
          ],
        },
        {
          heading: '🤖 Leafy — Din AI-assistent',
          text: 'Hvert WL Hive drives af Leafy, vores open-source AI-assistent. Leafy styrer energifordeling, overvåger luftkvalitet i realtid, optimerer ressourceforbrug og forbinder boligen til det bredere WL-fællesskabsnetværk. Jo mere Leafy lærer om dig, jo bedre tilpasser den sig dit liv.',
        },
        {
          heading: '🌱 Bæredygtige byggematerialer',
          text: 'WL Hive er bygget med hampbeton, genanvendt stål og genbrugt træ. Hampen, der anvendes i byggeriet, optager mere CO₂ under sin vækst end der udledes i hele byggeprocessen — hvilket gør hvert Hive til et netto CO₂-lager.',
        },
        {
          heading: '🔗 Del af et større netværk',
          text: 'WL Hive er ikke bare én bolig — det er en node i et levende netværk. Hiver deler overskudsenergi, ressourcer og viden med hinanden. Fællesskabet styrker den enkelte, og den enkelte styrker fællesskabet. Cirkulær økonomi i praksis, i hverdagen.',
        },
      ],
    },
  },

  /* ─────────────────────── 4. THE SHOP ─────────────────────── */
  {
    id: 'shop',
    label: 'Shop',
    subtitle: 'The Shop',
    color: '#60a5fa',
    emissiveColor: '#3b82f6',
    angle: 135,
    content: {
      title: 'WL Shop',
      tagline: 'Når du handler gennem WL, skaber du værdi for både dig selv og fællesskabet. Samtidig støtter du udviklingen af nye bæredygtige løsninger.',
      sections: [
        {
          heading: '💚 Fordele ved WL',
          text: "WL's økonomiske model giver op til 30% samlet værdi gennem fællesskabet. 20% er direkte besparelse for medlemmerne, og 10% investeres i nye projekter. Det skaber en økonomi, hvor fællesskabet vokser sammen.",
        },
      ],
    },
  },

  /* ─────────────────────── 5. SOCIAL MOVEMENT ─────────────────────── */
  {
    id: 'somo',
    label: 'SoMo',
    subtitle: 'Social Movement',
    color: '#c084fc',
    emissiveColor: '#a855f7',
    angle: 180,
    content: {
      title: 'Social Movement',
      tagline: 'Join the conversation. Shape the future.',
      sections: [
        {
          heading: '📱 Find Us Online',
          socials: [
            {
              platform: 'Instagram',
              handle: '@weeleaf',
              url: 'https://instagram.com/weeleaf',
              color: '#E1306C',
            },
            {
              platform: 'Facebook',
              handle: 'WeeLeaf Community',
              url: 'https://facebook.com/weeleaf',
              color: '#1877F2',
            },
            {
              platform: 'X / Twitter',
              handle: '@weeleaf',
              url: 'https://x.com/weeleaf',
              color: '#e2e8f0',
            },
          ],
        },
        {
          heading: '🌍 The Living Movement',
          text:
            "WeeLeaf is more than a brand — it's a growing community of people choosing to live differently. Share your sustainable journey, connect with like-minded individuals, and help prove that another way of living isn't just possible — it's already happening.",
        },
      ],
    },
  },

  /* ─────────────────────── 6. DONATIONS ─────────────────────── */
  {
    id: 'donations',
    label: 'Give',
    subtitle: 'Support WL',
    color: '#f472b6',
    emissiveColor: '#ec4899',
    angle: 225,
    content: {
      title: 'Støt WL',
      tagline: 'Én krone. Uendelige ringe i vandet.',
      sections: [
        {
          heading: '💚 Vis din opbakning',
          text: 'En symbolsk donation på blot 1 dansk krone er alt, hvad der skal til for at vise, at du tror på WL-visionen. Det handler ikke om penge — det handler om at tælle de mennesker, der vil med. Hvert bidrag er en stemme for en bedre verden.',
        },
        {
          heading: '🌱 Hvad din støtte betyder',
          items: [
            {
              name: 'Fællesskabets stemme',
              desc: 'Viser partnere og samarbejdspartnere, at rigtige mennesker står bag bevægelsen.',
            },
            {
              name: 'Retning for udviklingen',
              desc: 'Din opbakning hjælper os med at prioritere, hvilke produkter og funktioner vi bygger næst.',
            },
            {
              name: 'Grundlæggermedlemskab',
              desc: 'Du registreres som en af de første støtter i WLs grundlæggerarkiv.',
            },
          ],
        },
        {
          heading: '💳 Tilmeld din støtte',
          text: 'Betalingsintegration er på vej. Skriv til os i mellemtiden for at registrere din symbolske støtte og blive en del af grundlæggerlisten.',
          cta: { text: 'Skriv til os →', email: 'wl@weeleaf.com' },
        },
      ],
    },
  },

  /* ─────────────────────── 7. COMMUNITY ─────────────────────── */
  {
    id: 'community',
    label: 'Join',
    subtitle: 'Community',
    color: '#34d399',
    emissiveColor: '#10b981',
    angle: 270,
    content: {
      title: 'WL Community',
      tagline: 'Et digitalt fællesskab for mennesker, der vil udvikle bæredygtige idéer.',
    },
  },

  /* ─────────────────────── 8. MEMBER LOGIN ─────────────────────── */
  {
    id: 'member',
    label: 'Login',
    subtitle: 'Member Login',
    color: '#38bdf8',
    emissiveColor: '#0ea5e9',
    angle: 315,
    content: {
      title: 'WL Medlemslogin',
      tagline: 'Log ind for at skrive i Community',
      sections: [
        {
          heading: '🔑 Medlemsområde',
          text: 'Klik på denne node for at logge ind eller oprette en konto. Som medlem kan du udgive blogindlæg, der vises i Community-noden.',
        },
      ],
    },
  },
]
