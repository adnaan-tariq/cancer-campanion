import { useState, useEffect } from "react";
import emergencyContactsMap, { EmergencyContacts } from "@/data/emergencyContacts";

interface UseEmergencyContactsResult {
  loading: boolean;
  contacts: EmergencyContacts | null;
  denied: boolean;
}

const useEmergencyContacts = (): UseEmergencyContactsResult => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContacts | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      setDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const countryCode = data.countryCode as string;
          const found = emergencyContactsMap[countryCode] ?? null;
          setContacts(found);
        } catch {
          setDenied(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setDenied(true);
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  return { loading, contacts, denied };
};

export default useEmergencyContacts;
