import type { Metadata } from 'next';
import LegalPage from '@/screens/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privatnost - na kafu?',
};

// NACRT - pravni tekst proveriti pre lansiranja (Srbija ZZPL + GDPR, HANDOVER §9).
export default function PrivacyPage() {
  return (
    <LegalPage title="Politika privatnosti">
      <p>
        <em>Nacrt - finalni tekst potvrditi pre objave.</em>
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Šta čuvamo</h2>
      <p>
        Email pošiljaoca (uvek), tekst pozivnice, izabrana mesta, potpis i - opciono - fotografiju i par reči o sebi.
        Primalac ne pravi nalog; ako želi, ostavlja kontakt dobrovoljno.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Zašto</h2>
      <p>
        Da bismo isporučili pozivnicu i javili pošiljaocu odgovor. Pravni osnov: pošiljalac unosi svoje podatke;
        primalac daje kontakt uz saglasnost. Ne čuvamo više nego što je potrebno.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Brisanje i čuvanje</h2>
      <p>
        Pozivnicu možeš obrisati sa stranice za status. Podatke automatski brišemo nakon 90 dana. Za zahteve za
        brisanje: kontakt email (uskoro).
      </p>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Uzrast</h2>
      <p>Servis je namenjen osobama starijim od 18 godina.</p>
    </LegalPage>
  );
}
