// Mode-aware copy, ported verbatim from the prototype `COPY` const.
// `hint` and `sentLead` keep <b> markup (rendered via dangerouslySetInnerHTML — static, trusted).
// `{ime}` is interpolated with the recipient name.

import type { Mode } from '@/lib/types';

interface ModeCopy {
  potpis: string;           // signature sub-label on the build form
  send: string;             // submit button text
  hint: string;             // mode hint bar (HTML)
  sentLead: string;         // sent screen lead (HTML, {ime})
  recvTitle: { l1: string; l2: string }; // recipient page heading (l2 = accented)
  recvCardHeading?: string; // friend-mode invite card heading
}

export const COPY: Record<Mode, ModeCopy> = {
  direct: {
    potpis: '· vidi ga odmah',
    send: 'Pošalji pozivnicu',
    hint: '<b>Šalješ sam.</b> Dobićeš link koji prosleđuješ simpatiji. Ona vidi da si ti.',
    sentLead: 'Podeli link sa <b>{ime}</b> preko Instagrama ili poruke. Javimo ti čim odgovori.',
    recvTitle: { l1: 'Pozivnica', l2: 'za tebe.' },
  },
  friend: {
    potpis: '· vidi se tek kad prihvati',
    send: 'Napravi link za druga',
    hint: '<b>Preko druga.</b> Daješ link drugu od poverenja da ga prosledi. Ostaješ skriven dok ne prihvati.',
    sentLead: 'Daj ovaj link drugu od poverenja da ga prosledi <b>{ime}</b>. Ti ostaješ skriven dok ne prihvati.',
    recvTitle: { l1: 'Stiglo ti je', l2: 'preko druga.' },
    recvCardHeading: 'Nekome se dopadaš i želi da stupi u kontakt sa tobom',
  },
};
