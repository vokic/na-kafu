// Serbian copy inventory (HANDOVER §5.8). Single source of strings; locale-ready.
// Structural markup (line breaks, accent <span>) lives in components; plain text lives here.

import type { InviteStatus, EventType, ThemeName } from '@/lib/types';

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
    mode: { direct: 'Šaljem sam', friend: 'Preko druga', groupLabel: 'Kako šalješ pozivnicu' },
    themeNames: {
      light: 'Svetla',
      dark: 'Tamna',
      pink: 'Roze',
      peach: 'Breskva',
      holo: 'Holo',
      aurora: 'Aurora',
      indigo: 'Indigo',
    } as Record<ThemeName, string>,
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
    manageHint: 'Privatni link za praćenje (samo ti) poslali smo ti na mejl - preko njega pratiš odgovor i otkazuješ poziv.',
  },

  recv: {
    acceptDirect: 'Prihvati',
    decline: 'Odbij, hvala',
    reveal: 'Otkrij ko je',
    previewNote: 'Ovo je pregled - ovako vidi osoba koju zoveš. Odgovaranje je isključeno.',
    previewBack: 'Zatvori pregled',
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
    noContactNote: 'Bez kontakta te ne mogu sami naći - ostavi bar jedan način da ti se jave.',
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
    labels: { place: 'Mesto', contact: '', reason: 'Razlog', note: 'Poruka', herMessage: 'Poruka nazad' },
    friendHidden: 'Ostao si skriven - niko ne zna da si ti pitao.',
    friendRevealedNoContact: 'Sad zna ko si - javiće ti se, ili vas drug spoji.',
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
    declineNote: 'Hvala na lepom odgovoru.',
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
    } as Record<InviteStatus, string>,
  },

  events: {
    created: 'Pozivnica napravljena',
    link_opened: 'Link otvoren',
    revealed: 'Otkriveno ko si',
    accepted: 'Prihvaćeno',
    declined: 'Odbijeno',
    cancelled: 'Pozivnica otkazana',
    email_sent: 'Mejl poslat',
    email_failed: 'Mejl nije poslat',
    reported: 'Prijavljeno',
  } as Record<EventType, string>,

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
    subAccepted: 'Već si prihvatio/la ovu pozivnicu.',
    subDeclined: 'Već si odbio/la ovu pozivnicu.',
    cta: 'I ti pozovi nekoga',
  },

  loading: 'Učitavanje',

  errors: {
    generic: 'Nešto nije uspelo. Pokušaj ponovo.',
    network: 'Nema veze sa internetom. Proveri konekciju i pokušaj ponovo.',
    retry: 'Pokušaj ponovo',
  },

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
