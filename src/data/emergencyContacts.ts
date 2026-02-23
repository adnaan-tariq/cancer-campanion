export interface EmergencyContacts {
  country: string;
  flag: string;
  emergency: string;
  ambulance?: string;
  poisonControl?: string;
  cancerHelpline?: string;
}

const emergencyContactsMap: Record<string, EmergencyContacts> = {
  US: { country: "United States", flag: "🇺🇸", emergency: "911", poisonControl: "1-800-222-1222", cancerHelpline: "1-800-227-2345" },
  CA: { country: "Canada", flag: "🇨🇦", emergency: "911", poisonControl: "1-800-268-9017", cancerHelpline: "1-888-939-3333" },
  GB: { country: "United Kingdom", flag: "🇬🇧", emergency: "999", ambulance: "112", poisonControl: "111", cancerHelpline: "0808-800-4040" },
  AU: { country: "Australia", flag: "🇦🇺", emergency: "000", poisonControl: "13 11 26", cancerHelpline: "13 11 20" },
  IN: { country: "India", flag: "🇮🇳", emergency: "112", ambulance: "108", poisonControl: "1800-11-6117", cancerHelpline: "1800-11-5533" },
  DE: { country: "Germany", flag: "🇩🇪", emergency: "112", poisonControl: "030-19240" },
  FR: { country: "France", flag: "🇫🇷", emergency: "15", ambulance: "112", poisonControl: "01 40 05 48 48", cancerHelpline: "0 805 123 124" },
  IT: { country: "Italy", flag: "🇮🇹", emergency: "112", ambulance: "118" },
  ES: { country: "Spain", flag: "🇪🇸", emergency: "112", poisonControl: "91 562 04 20" },
  NL: { country: "Netherlands", flag: "🇳🇱", emergency: "112", poisonControl: "030-274 8888", cancerHelpline: "0800-022 66 22" },
  BE: { country: "Belgium", flag: "🇧🇪", emergency: "112", poisonControl: "070 245 245" },
  SE: { country: "Sweden", flag: "🇸🇪", emergency: "112", poisonControl: "010-456 6700", cancerHelpline: "020-59 59 59" },
  NO: { country: "Norway", flag: "🇳🇴", emergency: "113", poisonControl: "22 59 13 00", cancerHelpline: "21 49 49 21" },
  DK: { country: "Denmark", flag: "🇩🇰", emergency: "112", poisonControl: "82 12 12 12", cancerHelpline: "80 30 10 30" },
  FI: { country: "Finland", flag: "🇫🇮", emergency: "112", poisonControl: "0800 147 111" },
  PT: { country: "Portugal", flag: "🇵🇹", emergency: "112", poisonControl: "808 250 143" },
  AT: { country: "Austria", flag: "🇦🇹", emergency: "112", poisonControl: "01 406 43 43", cancerHelpline: "0800 899 899" },
  CH: { country: "Switzerland", flag: "🇨🇭", emergency: "112", ambulance: "144", poisonControl: "145", cancerHelpline: "0800 11 88 11" },
  IE: { country: "Ireland", flag: "🇮🇪", emergency: "112", poisonControl: "01 809 2166", cancerHelpline: "1800 200 700" },
  NZ: { country: "New Zealand", flag: "🇳🇿", emergency: "111", poisonControl: "0800 764 766", cancerHelpline: "0800 226 237" },
  JP: { country: "Japan", flag: "🇯🇵", emergency: "119", ambulance: "119", poisonControl: "072-727-2499" },
  KR: { country: "South Korea", flag: "🇰🇷", emergency: "119", poisonControl: "1339" },
  SG: { country: "Singapore", flag: "🇸🇬", emergency: "995", poisonControl: "6423 9119", cancerHelpline: "6225 5655" },
  ZA: { country: "South Africa", flag: "🇿🇦", emergency: "10111", ambulance: "10177", poisonControl: "0861 555 777", cancerHelpline: "0800 22 6622" },
  BR: { country: "Brazil", flag: "🇧🇷", emergency: "192", poisonControl: "0800 722 6001" },
  MX: { country: "Mexico", flag: "🇲🇽", emergency: "911", poisonControl: "800 00 92 800" },
  PH: { country: "Philippines", flag: "🇵🇭", emergency: "911", poisonControl: "(02) 8524-1078" },
  MY: { country: "Malaysia", flag: "🇲🇾", emergency: "999", ambulance: "112" },
  AE: { country: "UAE", flag: "🇦🇪", emergency: "999", ambulance: "998" },
  SA: { country: "Saudi Arabia", flag: "🇸🇦", emergency: "911", ambulance: "997" },
  PK: { country: "Pakistan", flag: "🇵🇰", emergency: "115", ambulance: "1122", poisonControl: "0800-222-44", cancerHelpline: "0800-11553" },
  PL: { country: "Poland", flag: "🇵🇱", emergency: "112", ambulance: "999", poisonControl: "22 619 66 54" },
  CZ: { country: "Czech Republic", flag: "🇨🇿", emergency: "112", ambulance: "155", poisonControl: "224 919 293" },
};

export default emergencyContactsMap;
