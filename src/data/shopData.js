/**
 * Default shop categories & products.
 * Each category has an id, label, icon (emoji), color (hex), and products[].
 * Each product has an id, name, desc, price (optional), imageUrl (optional), link (optional).
 * These are loaded into Zustand and overridden by localStorage edits via the Admin panel.
 */
export const DEFAULT_SHOP_CATEGORIES = [
  {
    id: 'tekstiler',
    label: 'Tekstiler',
    icon: '🛏️',
    color: '#60a5fa',
    products: [
      {
        id: 'towels-gots',
        name: 'Håndklæder 100% Hamp Sort (GOTS)',
        desc: 'Føl forskellen – 100% hamp frøte, 650 GSM. Naturligt antibakterielle håndklæder, der forbliver friske længere og kræver færre vaske ved lavere temperaturer. Det er godt for dig – og for planeten. Fås i naturlig hvid (ublegt) eller farvet med GOTS-certificerede farvestoffer. Hamp er antibakterielt af natur, så du kan vaske dine tekstiler sjældnere og ved kun 30–40°C – det forlænger levetiden og sparer energi.',
        price: '',
        imageUrl: '',
        link: 'https://hempcph.com',
      },
      {
        id: 'duvet-cover',
        name: 'Hampedyne Cover Sæt (OEKO-TEX)',
        desc: 'Naturligt temperaturregulerende dynebetræk fremstillet af 100% hamp. Antibakterielt, allergivenligt og certificeret med OEKO-TEX. Bliver blødere med hvert vask og holder på varmen om vinteren og køler om sommeren.',
        price: '',
        imageUrl: '',
        link: 'https://hempcph.com',
      },
      {
        id: 'pillowcase',
        name: 'Hamp Pudebetræk (2-pak)',
        desc: 'Antimikrobielt pudebetræk i 100% hamp. Certificeret OEKO-TEX. Hurtigttørrende og ekstremt slidstærkt — et produkt der holder livet ud.',
        price: '',
        imageUrl: '',
        link: 'https://hempcph.com',
      },
    ],
  },
  {
    id: 'hudpleje',
    label: 'Hudpleje',
    icon: '🧴',
    color: '#86efac',
    products: [],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: '✨',
    color: '#c084fc',
    products: [],
  },
]
