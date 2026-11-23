export const artist = {
  name: 'Sergio Bellotti',
  tagline: 'Groove On',
  email: 'sergiobellotti@gmail.com',
  canonical: 'https://www.sergiobellotti.com',
  instagram: 'https://www.instagram.com/sergio.bellotti/',
  youtube: 'https://www.youtube.com/user/sbellotti/videos',
  berklee: 'https://college.berklee.edu/people/sergio-bellotti',
  press: 'https://www.sergiobellotti.com/e-press-kit',
  reel: 'D4CExKKmFZE',
} as const;

export const pages = [
  { label: 'About', href: '/about/' },
  { label: 'Music', href: '/work/' },
  { label: 'Education', href: '/education/' },
  { label: 'Workshops & Clinics', href: '/workshops/' },
] as const;
