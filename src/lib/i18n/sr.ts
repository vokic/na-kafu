// Serbian copy inventory (HANDOVER §5.8). Single source of strings; locale-ready.
// Structural markup (line breaks, accent <span>) lives in components; plain text lives here.

export const SR = {
  brand: 'na kafu?',

  // Desktop-only left-pane captions (one per step).
  aside: {
    home: 'Bez treme.',
    build: 'Reci ko, šta i gde.',
    sent: 'Podeli link.',
    receive: 'Neko te zove.',
    reveal: 'Ko se krije?',
    accept: 'Reci da.',
    reject: 'Reci ne, lepo.',
    result: 'Poslato.',
    manage: 'Pratiš status.',
    loading: 'Tren…',
    gone: 'Nije dostupno.',
  },

  home: {
    // Rotating accent line; each completes "Pozovi nekoga, ___"
    accents: ['bez treme.', 'na kreativan način.', 'hrabro.', 'bez stresa.', 'iz prve.', 'lako.', 'danas.'],
    sub: 'Pošalji pozivnicu na izlazak - sam, ili diskretno preko zajedničkog druga.',
    cta: 'Napravi pozivnicu',
  },

  build: {
    mode: { direct: 'Šaljem sam', friend: 'Preko druga' },
    heading: { l1: 'Za', l2: 'koga?' },
    fields: {
      name: 'Ime ili nadimak',
      message: 'Poruka',
      places: 'Gde biste mogli?',
      placesHint: 'izaberi 2–4',
      signature: 'Tvoj potpis',
      email: 'Tvoj email',
      emailHint: 'da ti javimo kad odgovori',
      about: 'O sebi',
      photo: 'Slika',
      theme: 'Tema pozivnice',
      opt: 'opciono',
    },
    aboutPlaceholder: 'Par reči o tebi - šta voliš, čime se baviš.',
    messageHint:
      'Ovo najviše utiče na ishod - budi svoj, duhovit i iskren. Kulturno, naravno; nepristojno ponašanje se trajno blokira, bez izuzetka.',
    addPhoto: '+ Dodaj sliku',
    back: 'Nazad',
  },

  sent: {
    heading: { l1: 'Link', l2: 'spreman.' },
    copy: 'Kopiraj',
    copied: 'Kopirano',
    preview: 'Pogledaj iz njene perspektive',
    newOne: 'Napravi novu',
    expiryInfo:
      'Pozivnica važi do sutra u ovo vreme. Ako je tvoja simpatija ne otvori, više neće biti validna i moraćeš da napraviš novu.',
  },

  recv: {
    acceptDirect: 'Prihvati',
    decline: 'Odbij, hvala',
    reveal: 'Otkrij ko je',
  },

  reveal: {
    heading: { l1: 'Pozivnicu', l2: 'šalje…' },
    accept: 'Prihvati',
    reject: 'Ipak ne',
  },

  accept: {
    heading: { l1: 'Biraj', l2: 'mesto.' },
    placeLabel: 'Gde ti odgovara',
    contactLabel: 'Ostavi kontakt',
    replyLabel: 'Poruka nazad',
    replyPlaceholder: 'Dodaj reč-dve ako želiš.',
    submit: 'Pošalji odgovor',
    back: 'Nazad',
    opt: 'opciono',
    contactShort: { Instagram: 'Insta', Telefon: 'Tel', Email: 'Email', Snapchat: 'Snap' } as Record<string, string>,
    placeholders: {
      Instagram: '@tvoj_nalog',
      Telefon: '06x xxx xxxx',
      Email: 'ime@mejl.com',
      Snapchat: 'tvoj_snap',
    } as Record<string, string>,
  },

  reject: {
    heading: { l1: 'Reci ne,', l2: 'lepo.' },
    lead: 'Razlog je obavezan, ali ostaje između vas. Pomaže drugoj strani.',
    reasonLabel: 'Razlog',
    noteLabel: 'Poruka',
    notePlaceholder: 'Drago mi je što si pitao.',
    submit: 'Pošalji odgovor',
  },

  result: {
    declineTitle: 'Ovaj put ne.',
    acceptTitleSuffix: 'kaže da!', // "{ime} kaže da!"
    labels: { place: 'Mesto', contact: '', reason: 'Razlog', note: 'Poruka', herMessage: 'Njena poruka' },
    friendHidden: 'Ostao si skriven - niko ne zna da si ti pitao.',
    friendRevealedNoContact: 'Otkrila je ko si - javiće ti se, ili vas drug spoji.',
    newInvite: 'Napravi novu pozivnicu',
  },

  // Recipient-side confirmation (prod: recipient sees a confirmation, not the sender's result)
  rating: {
    question: 'Kako ti se dopada ovaj servis?',
    commentPlaceholder: 'Kratak komentar (opciono)…',
    send: 'Pošalji',
    thanks: 'Hvala na oceni!',
  },

  recipientResult: {
    acceptTitle: 'Poslato!',
    declineTitle: 'Poslato.',
    acceptNote: 'Prosledili smo tvoj odgovor.',
    declineNote: 'Hvala što si odgovorila lepo.',
    ownCta: 'I ti pozovi nekoga',
    placeChosen: 'Tvoj izbor',
  },

  manage: {
    heading: { l1: 'Status', l2: 'pozivnice.' },
    forWhom: 'Za',
    waiting: 'Još nema odgovora.',
    waitingSub: 'Javićemo ti čim odgovori. Ovde pratiš status.',
    timeline: 'Tok',
    yourLink: 'Tvoj link',
    cancel: 'Otkaži poziv',
    cancelConfirm: 'Sigurno? Link odmah prestaje da važi i ne može da se vrati.',
    cancelYes: 'Da, otkaži',
    cancelNo: 'Ne, ostavi',
    cancelledTitle: 'Pozivnica je otkazana.',
    cancelledSub: 'Link više ne radi.',
    statusLabels: {
      pending: 'Poslato',
      opened: 'Otvoreno',
      accepted: 'Prihvaćeno',
      declined: 'Odbijeno',
      cancelled: 'Otkazano',
    } as Record<string, string>,
  },

  events: {
    created: 'Pozivnica napravljena',
    link_opened: 'Link otvoren',
    revealed: 'Otkrila je ko si',
    accepted: 'Prihvatila je',
    declined: 'Odbila je',
    cancelled: 'Pozivnica otkazana',
    email_sent: 'Mejl poslat',
    email_failed: 'Mejl nije poslat',
    reported: 'Prijavljeno',
  } as Record<string, string>,

  notFound: {
    title: 'Pozivnica ne postoji.',
    sub: 'Link je možda pogrešan ili je istekao.',
    cta: 'Napravi svoju pozivnicu',
  },

  expired: {
    title: 'Pozivnica je istekla.',
    sub: 'Neko je pokušao da stupi u kontakt sa tobom, ali nije uspeo. Možda će skupiti hrabrost da to uradi ponovo.',
    cta: 'Napravi svoju pozivnicu',
  },

  alreadyResponded: {
    title: 'Već je odgovoreno.',
    sub: 'Na ovu pozivnicu je već dat odgovor.',
    cta: 'I ti pozovi nekoga',
  },

  loading: 'Učitavanje',

  reasons: [
    'Već sam zauzet/a',
    'Nije pravo vreme',
    'Ne tražim ništa sad',
    'Ne osećam tu privlačnost',
    'Radije kao prijatelji',
  ],

  places: ['Kafa', 'Piće', 'Večera', 'Šetnja', 'Bioskop', 'Klopa', 'Svirka', 'Izložba'],

  eggs: [
    'hej ćao 👋',
    'uh, baš si uporan',
    '20 klikova, ko broji 👀',
    'polako, srce sam',
    'kuc kuc, ima li koga?',
    'škakljaš me 😄',
    'pozovi nekog već',
    'stani, zaljubiću se',
    'još malo pa na kafu',
    'ti bi mene na dejt? 💘',
  ],
} as const;
