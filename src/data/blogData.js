/**
 * Default blog posts for the WL Community coin.
 * Each post: id, title, author, date (ISO string), body (plain text / newlines = paragraphs), tags[].
 * Stored in localStorage via useStore and editable from the Admin panel → Blog tab.
 */
export const DEFAULT_BLOG_POSTS = [
  {
    id: 'welcome-post',
    title: 'Velkommen til WL Community',
    author: 'WL Team',
    date: '2026-04-30T10:00:00.000Z',
    body: 'WL Community er et digitalt fællesskab for mennesker, der vil udvikle bæredygtige idéer. Her kan medlemmer dele projekter, samarbejde og lære sammen.\n\nPlatformen bygges i fællesskab af dem, der ønsker at være med. Uanset om du er udvikler, designer, landmand, iværksætter eller nysgerrig nybegynder — der er plads til dig her.\n\nDette er det første indlæg på WL Community-bloggen. Vi glæder os til at bygge videre sammen med dig.',
    tags: ['fællesskab', 'velkommen', 'wl'],
  },
  {
    id: 'hemp-future',
    title: 'Hamp er fremtidens materiale',
    author: 'WL Team',
    date: '2026-04-28T08:00:00.000Z',
    body: 'Vidste du, at hamp er en af verdens mest alsidige planter? Den vokser hurtigt, kræver ingen pesticider og optager store mængder CO₂ undervejs.\n\nHos WL bruger vi hamp i alt fra tekstiler til byggematerialer. Vi tror på, at naturen allerede har løsningerne — vi skal bare bruge dem klogt.\n\nHar du et projekt eller en idé, der involverer hamp? Del det i fællesskabet.',
    tags: ['hamp', 'bæredygtighed', 'materialer'],
  },
]
