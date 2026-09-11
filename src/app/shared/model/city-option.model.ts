export interface CityOption {
  key: string;
  name: string;
  state: string;
  image: string;
}

export const CITY_OPTIONS: readonly CityOption[] = [
  {
    key: 'austin',
    name: 'Austin',
    state: 'TX',
    image: '/images/cities/austin-hero.png'
  },
  {
    key: 'dallas',
    name: 'Dallas',
    state: 'TX',
    image: '/images/cities/dallas-hero.png'
  },
  {
    key: 'houston',
    name: 'Houston',
    state: 'TX',
    image: '/images/cities/houston-hero.png'
  },
  {
    key: 'chicago',
    name: 'Chicago',
    state: 'IL',
    image: '/images/cities/chicago-hero.png'
  },
  {
    key: 'atlanta',
    name: 'Atlanta',
    state: 'GA',
    image: '/images/cities/atlanta-hero.png'
  }
];

export const DEFAULT_CITY = CITY_OPTIONS[0];

export const DEFAULT_CITY_IMAGE =
  '/images/cities/default-hero.png';