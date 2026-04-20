// Orbit geometry constants
export const ORBIT_RADIUS = 5.2
export const ORBIT_HEIGHT = 0.8

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
    angle: 0,
    content: {
      title: 'WeeLeaf — The Core',
      tagline: 'A Sustainable Community Movement',
      sections: [
        {
          heading: '♾️ Our 5 Founding Principles',
          items: [
            {
              name: 'Circularity',
              desc: 'We design systems where every resource flows back into the cycle — zero waste by design.',
            },
            {
              name: 'Sustainability',
              desc: 'Long-term ecological and social well-being always takes priority over short-term gain.',
            },
            {
              name: 'Innovation',
              desc: 'Technology and nature in harmony — from AI-driven homes to blockchain community tools.',
            },
            {
              name: 'Community',
              desc: 'Decisions are made collectively. Every member has a voice and a meaningful stake.',
            },
            {
              name: 'Economic Responsibility',
              desc: 'Transparent, ethical financial flows designed to benefit the many, not the few.',
            },
          ],
        },
        {
          heading: '💰 The 20 / 10 / 30 Economic Model',
          text:
            'WL operates on a transparent profit-sharing model: 20% is reinvested into R&D and innovation; 10% is held in a community resilience reserve; 30% is distributed directly to active community members. The remaining 40% covers operational costs and sustainable growth infrastructure.',
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
    angle: 51.43,
    content: {
      title: 'Hemptation',
      tagline: "Nature's most versatile plant, refined.",
      sections: [
        {
          heading: '🌿 Wholesome Skincare',
          text:
            'Our "Wholesome" line is 100% natural, vegan, and powered by cold-pressed hemp seed oil. Rich in omega-3 and omega-6 fatty acids, our formulas deeply nourish skin without synthetic additives, parabens, or fillers. Pure earth. Zero compromise.',
          items: [
            { name: 'Hemp Seed Face Oil', desc: 'Balancing & nourishing for all skin types' },
            { name: 'Body Butter', desc: 'Deep moisture with shea butter and hemp extract' },
            { name: 'Lip Balm', desc: 'Natural SPF protection with hemp and beeswax' },
          ],
        },
        {
          heading: '🛏️ Harmony & Wellness Textiles',
          text:
            'Our OEKO-TEX® Standard 100 certified hemp bedding is the future of sustainable sleep. Hemp fabric is naturally thermoregulating, antimicrobial, and gets measurably softer with every wash — certified safe for humans and the planet.',
          link: { text: 'Browse Hemp CPH Textiles', url: 'https://hempcph.com' },
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
    angle: 102.86,
    content: {
      title: 'WL Hive',
      tagline: 'The home of the future, built today.',
      sections: [
        {
          heading: '🏠 Self-Sufficient Living',
          text:
            'WL Hive is a modular, carbon-negative housing ecosystem. Each unit produces more energy than it consumes, manages its own water cycle through greywater reclamation, and can grow a portion of its own food via integrated aquaponics or vertical gardens.',
        },
        {
          heading: '🤖 Leafy — Your AI Home Intelligence',
          text:
            'Every WL Hive is powered by Leafy, our open-source AI assistant. Leafy manages energy distribution, monitors air quality in real time, optimizes resource consumption, and connects each home to the wider WL community network.',
        },
        {
          heading: '🛡️ NBC Safety Architecture',
          text:
            'WL Hive incorporates Nuclear, Biological, and Chemical resilience protocols — sealed positive-pressure ventilation with HEPA + activated carbon filtration, automated lockdown systems, and 30-day emergency supply reserves for genuine self-reliance.',
        },
        {
          heading: '🌱 Carbon-Negative Construction',
          text:
            'Built with hempcrete, recycled steel, and reclaimed timber. The hemp grown for construction sequesters more CO₂ during its growth cycle than is emitted across the entire build process — making each Hive a net carbon sink.',
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
    angle: 154.29,
    content: {
      title: 'The Collective Shop',
      tagline: 'Buy together. Waste nothing.',
      sections: [
        {
          heading: '🤝 Collective Buying Power',
          text:
            'The WL Shop operates on a community purchasing model. Orders are pooled to reach Minimum Order Quantities (MOQ), drastically cutting overproduction. Every item manufactured is already wanted — no guesswork, no surplus.',
        },
        {
          heading: '📦 How MOQ Logic Works',
          text:
            "Products are listed with a target quantity pledge threshold. Community members commit their order. When MOQ is reached, production begins. If the threshold isn't met within the pledge window, all commitments are released — zero waste, zero obligation.",
        },
        {
          heading: '🌿 Featured: Hemp CPH Textiles',
          items: [
            {
              name: 'Hemp Duvet Cover Set',
              desc: 'OEKO-TEX® certified, naturally cooling, hypoallergenic',
              link: 'https://hempcph.com',
            },
            {
              name: 'Hemp Pillowcases (2-pack)',
              desc: 'Antimicrobial, gets softer with every wash',
              link: 'https://hempcph.com',
            },
            {
              name: 'Hemp Bath Towels',
              desc: 'Quick-dry, ultra-absorbent, planet-safe',
              link: 'https://hempcph.com',
            },
          ],
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
    angle: 205.71,
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
    angle: 257.14,
    content: {
      title: 'Support WeeLeaf',
      tagline: 'One Krone. Infinite ripple.',
      sections: [
        {
          heading: '💚 Show Your Interest',
          text:
            'A symbolic donation of just 1 Danish Krone (DKK) is all it takes to signal belief in the WeeLeaf vision. This is not about funding — it is about counting the people who care. Every pledge is a vote for a better world, recorded permanently.',
        },
        {
          heading: '🌱 What Your Support Signals',
          items: [
            {
              name: 'Community Validation',
              desc: 'Demonstrates to partners and investors that real people stand behind this movement',
            },
            {
              name: 'Development Priority',
              desc: 'Your pledge helps us prioritise which features and products to build next',
            },
            {
              name: 'Founding Membership',
              desc: "You'll be recorded as an early supporter in the WL founding archive",
            },
          ],
        },
        {
          heading: '💳 Register Your 1 Krone Pledge',
          text:
            'Payment integration is coming soon. In the meantime, reach out directly to register your symbolic support and get added to our founding community list.',
          cta: { text: 'Register Interest →', email: 'wl@weeleaf.com' },
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
    angle: 308.57,
    content: {
      title: 'Build WeeLeaf Together',
      tagline: 'Every expert. Every creative. Every dreamer.',
      sections: [
        {
          heading: "🛠️ Who We're Looking For",
          items: [
            { name: 'Frontend Developers', desc: 'React, Three.js, creative web & interactive experiences' },
            {
              name: 'Backend Engineers',
              desc: 'Node.js, Python, API design, data pipelines & infrastructure',
            },
            { name: 'UX/UI Designers', desc: 'Systems thinking merged with beautiful, human interfaces' },
            {
              name: 'Content Creators',
              desc: 'Writers, videographers, illustrators, photographers',
            },
            {
              name: 'Sustainability Experts',
              desc: 'Circular economy, permaculture, green building, regenerative agriculture',
            },
            {
              name: 'Community Builders',
              desc: 'Event organisers, connectors, educators, advocates',
            },
          ],
        },
        {
          heading: '🌿 How Contribution Works',
          text:
            'WL runs on community contribution. Members who help build the platform earn WL tokens — redeemable for products, services, and growing community benefits. Your skills are your stake in the movement.',
        },
        {
          heading: '✉️ Get Involved',
          text:
            'Send us a message with who you are and what you bring. We are building something real, and we want you at the table from the beginning.',
          cta: { text: 'Email the Team', email: 'wl@weeleaf.com' },
        },
      ],
    },
  },
]
