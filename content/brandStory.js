/* ------------------------------------------------------------------
   BERMITO.IN — EDITABLE CONTENT
   This is the only file you need to touch to update story copy,
   labels, links and the facts that are still awaiting approval.
   Anything left as null is omitted from the page automatically —
   no placeholder text is ever rendered.
------------------------------------------------------------------- */

window.BERMITO_CONTENT = {

  /* --- FACTS AWAITING APPROVAL -----------------------------------
     Fill these in and the site picks them up. Leave null to omit.  */
  facts: {
    foundingYear: null,          // e.g. "2023"  → appears in loader, hero label, footer
    roasteryAddress: null,       // e.g. "Street, Kozhikode 673xxx"
    roasteryCoords: null,        // e.g. { lat: 11.2588, lon: 75.7804 } — exact roastery pin
    founders: null,              // e.g. ["Vajid K", "Hadi K"]
    phone: null,                 // verify on bermito.com before publishing
    email: null                  // verify on bermito.com before publishing
  },

  /* --- MAP JOURNEY -----------------------------------------------
     Camera stops. Bounds are [west, south, east, north] in degrees.
     Kozhikode is held at city level until an approved roastery
     coordinate is supplied above.                                  */
  journey: [
    { id: 'world',     index: '01', label: 'WORLD',      sub: 'THE WHOLE MAP',
      bounds: [-170, -58, 178, 76],       coord: null },
    { id: 'india',     index: '02', label: 'INDIA',      sub: 'ONE COUNTRY',
      bounds: [65.5, 5.5, 98.5, 37.5],    coord: '20.59° N  78.96° E' },
    { id: 'kerala',    index: '03', label: 'KERALA',     sub: 'THE MALABAR COAST',
      bounds: [74.2, 8.0, 78.0, 12.9],    coord: '10.85° N  76.27° E' },
    { id: 'kozhikode', index: '04', label: 'KOZHIKODE',  sub: 'WHERE WE ROAST',
      bounds: [74.70, 10.42, 76.86, 12.08], coord: '11.2588° N  75.7804° E' }
  ],

  /* Kozhikode city-level marker — replaced by facts.roasteryCoords
     when an approved roastery location is supplied.                */
  marker: { lat: 11.2588, lon: 75.7804, label: 'BERMITO', sub: 'KOZHIKODE' },

  /* --- STORY TIMELINE --------------------------------------------
     Add `year` to any chapter once dates are approved; the timeline
     renders it automatically. Do not invent dates.                 */
  chapters: [
    {
      n: '01',
      title: 'THE CUP\nTHAT STAYED',
      year: null,
      accent: 'beige',
      body: [
        'It began with a cup that could never be repeated. A small nano-lot, full of life, character and a moment that would never arrive in exactly the same way again.',
        'That cup became the beginning of Bermito.'
      ],
      label: 'A FIRST CUPPING',
      image: 'assets/images/story-01-cup.jpg',
      alt: 'The first nano-lot cupping that started Bermito — bowls set out on a table in Kozhikode.'
    },
    {
      n: '02',
      title: 'BORN IN\nKOZHIKODE',
      year: null,
      accent: 'blue',
      body: [
        'In Kozhikode, a city shaped by trade, hospitality and flavour, we began roasting coffee differently.',
        'Slowly. Carefully. One small batch at a time.'
      ],
      label: 'KOZHIKODE / KERALA',
      image: 'assets/images/story-02-kozhikode-roastery.jpg',
      alt: 'The first Bermito roastery space in Kozhikode.'
    },
    {
      n: '03',
      title: 'GOING WHERE\nCOFFEE TAKES US',
      year: null,
      accent: 'forest',
      body: [
        'We go wherever coffee takes us — farms, mountains and quiet corners where it grows at its own pace.',
        'We look for curious producers, thoughtful processes and coffees with something honest to say.'
      ],
      label: 'AT ORIGIN',
      image: 'assets/images/story-03-origin-producer.jpg',
      alt: 'A producer walking through a shaded coffee farm at origin.'
    },
    {
      n: '04',
      title: 'ROASTED WITH\nINTENTION',
      year: null,
      accent: 'yellow',
      body: [
        'We roast with intention, not urgency.',
        'Every batch is handled with patience, listening to the coffee and responding to it rather than forcing a formula.',
        'Some coffees last for weeks. Some never return. That is not a flaw. That is the point.'
      ],
      label: 'IN THE ROASTERY',
      image: 'assets/images/story-04-roasting.jpg',
      alt: 'Hands working at the roaster during development, beans in the trier.'
    },
    {
      n: '05',
      title: 'LIVE\nTHROUGH COFFEE',
      year: null,
      accent: 'violet',
      body: [
        'Bermito is for those who believe coffee is more than a habit.',
        'It is a moment. A ritual. A quiet companion through the day.',
        'We live through coffee.'
      ],
      label: 'THE BREW ROOM',
      image: 'assets/images/story-05-community.jpg',
      alt: 'People sharing coffee together at a Bermito brewing session.'
    }
  ],

  /* --- TASTING RITUAL --------------------------------------------- */
  tasting: [
    { id: 'observe', name: 'OBSERVE', text: 'Before taking a sip, notice its colour, clarity and movement in the cup.', art: 'assets/brand/tasting-01-observe.svg' },
    { id: 'smell', name: 'SMELL', text: 'Inhale the aroma before sipping — floral, nutty, chocolaty?', art: 'assets/brand/tasting-02-smell.svg' },
    { id: 'sip', name: 'SIP & SLURP', text: 'Take a small sip, let it coat your tongue, and slurp gently to spread the flavours.', art: 'assets/brand/tasting-03-sip-slurp.svg' },
    { id: 'finish', name: 'ENJOY & FINISH', text: 'Notice how the flavours evolve and the aftertaste lingers.', art: 'assets/brand/tasting-04-enjoy-finish.svg' }
  ],

  /* --- VALUES ------------------------------------------------------ */
  values: [
    { name: 'CLARITY', text: 'We roast and communicate with honesty, allowing each coffee to show its own character.', icon: 'assets/brand/icon-clarity.svg' },
    { name: 'CONTINUITY', text: 'We respect the relationships, knowledge and rituals that carry coffee from the land to the cup.', icon: 'assets/brand/icon-continuity.svg' },
    { name: 'RESPONSIBILITY', text: 'We care for the coffee, the people and the work behind every batch.', icon: 'assets/brand/icon-responsibility.svg' }
  ],

  /* --- OUTBOUND LINKS ---------------------------------------------
     VERIFY every one of these against bermito.com before publishing.
     Set social links to null until approved handles are confirmed.  */
  links: {
    shop:     'https://bermito.com/collections/all',
    home:     'https://bermito.com/',
    journal:  'https://bermito.com/blogs/journal',
    brewRoom: 'https://bermito.com/pages/brew-room',
    roastery: 'https://bermito.com/pages/about',
    contact:  'https://bermito.com/pages/contact',
    privacy:  'https://bermito.com/policies/privacy-policy',
    instagram: null,
    youtube:   null
  }
};
