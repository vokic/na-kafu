import type { Metadata } from 'next';
import LegalPage from '@/screens/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Uslovi korišćenja — na kafu?',
};

// NACRT — pravni tekst proveriti pre lansiranja.
export default function TermsPage() {
  return (
    <LegalPage title="Uslovi korišćenja">
      <p>
        <em>Nacrt — finalni tekst potvrditi pre objave.</em>
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Šta je „na kafu?“</h2>
      <p>
        Servis za slanje pozivnica na izlazak — sam ili diskretno preko zajedničkog druga. Koristiš ga pristojno i u
        skladu sa zakonom.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Pravila</h2>
      <p>
        Bez uznemiravanja, govora mržnje, lažnog predstavljanja ili slanja tuđih ličnih podataka bez osnova. Sadržaj
        koji krši pravila može biti uklonjen, a pozivnica onemogućena.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Uzrast</h2>
      <p>Korišćenjem servisa potvrđuješ da imaš najmanje 18 godina.</p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Odgovornost</h2>
      <p>Servis se pruža „takav kakav jeste“. Susreti i kontakt van platforme su na sopstvenu odgovornost korisnika.</p>
    </LegalPage>
  );
}
