/**
 * Deterministic location normalizer
 * Merges 6,900+ messy location variants into clean canonical names
 */

// Country code → country name
const COUNTRY_CODES: Record<string, string> = {
  'us': 'United States', 'usa': 'United States', 'u.s.': 'United States',
  'uk': 'United Kingdom', 'gb': 'United Kingdom',
  'sg': 'Singapore', 'sgp': 'Singapore',
  'au': 'Australia', 'ca': 'Canada', 'de': 'Germany',
  'fr': 'France', 'in': 'India', 'jp': 'Japan',
  'br': 'Brazil', 'es': 'Spain', 'nl': 'Netherlands',
  'ie': 'Ireland', 'il': 'Israel', 'kr': 'South Korea',
  'mx': 'Mexico', 'se': 'Sweden', 'ch': 'Switzerland',
  'it': 'Italy', 'pt': 'Portugal', 'pl': 'Poland',
  'my': 'Malaysia', 'ph': 'Philippines', 'th': 'Thailand',
  'id': 'Indonesia', 'vn': 'Vietnam', 'tw': 'Taiwan',
  'hk': 'Hong Kong', 'nz': 'New Zealand', 'ar': 'Argentina',
  'co': 'Colombia', 'cl': 'Chile', 'za': 'South Africa',
  'ae': 'UAE', 'at': 'Austria', 'be': 'Belgium',
  'dk': 'Denmark', 'fi': 'Finland', 'no': 'Norway',
  'cz': 'Czech Republic', 'ro': 'Romania', 'hu': 'Hungary',
};

// US state abbr → full name (for stripping)
const US_STATES: Record<string, string> = {
  'ca': 'California', 'ny': 'New York', 'tx': 'Texas', 'wa': 'Washington',
  'ma': 'Massachusetts', 'il': 'Illinois', 'co': 'Colorado', 'ga': 'Georgia',
  'pa': 'Pennsylvania', 'va': 'Virginia', 'fl': 'Florida', 'nc': 'North Carolina',
  'md': 'Maryland', 'or': 'Oregon', 'az': 'Arizona', 'oh': 'Ohio',
  'mi': 'Michigan', 'mn': 'Minnesota', 'ct': 'Connecticut', 'nj': 'New Jersey',
  'dc': 'DC', 'ut': 'Utah', 'tn': 'Tennessee', 'mo': 'Missouri',
};

// Exact-match overrides (lowercased)
const EXACT_MAP: Record<string, string> = {
  'unknown': 'Remote',
  'hybrid': 'Hybrid',
  'worldwide': 'Remote',
  'anywhere': 'Remote',
  'global': 'Remote',
  'earth': 'Remote',
  'asia': 'Asia',
  'apac': 'Asia-Pacific',
  'emea': 'EMEA',
  'europe': 'Europe',
  'latam': 'Latin America',
  'united states': 'USA',
  'united kingdom': 'United Kingdom',
  'usa': 'USA',
  'u.s.': 'USA',
  'india': 'India',
  'brazil': 'Brazil',
  'canada': 'Canada',
  'philippines': 'Philippines',
  'bengaluru': 'India',
  'bengaluru, india': 'India',
  'bengaluru, in': 'India',
  'bangalore, karnataka': 'India',
  'bangalore, india': 'India',
  'bangalore, karnataka, india': 'India',
};

// City name patterns → canonical name
// US cities all collapse to "USA"
const CITY_PATTERNS: [RegExp, string][] = [
  // US cities → all "USA"
  [/^san francisco/i, 'USA'],
  [/^new york|^nyc/i, 'USA'],
  [/^los angeles/i, 'USA'],
  [/^boston/i, 'USA'],
  [/^austin/i, 'USA'],
  [/^seattle/i, 'USA'],
  [/^chicago/i, 'USA'],
  [/^denver/i, 'USA'],
  [/^palo alto/i, 'USA'],
  [/^mountain view/i, 'USA'],
  [/^sunnyvale/i, 'USA'],
  [/^menlo park/i, 'USA'],
  [/^san mateo/i, 'USA'],
  [/^san jose/i, 'USA'],
  [/^washington,?\s*d\.?c\.?/i, 'USA'],
  [/^portland/i, 'USA'],
  [/^atlanta/i, 'USA'],
  [/^miami/i, 'USA'],
  [/^dallas/i, 'USA'],
  [/^san diego/i, 'USA'],
  [/^pittsburgh/i, 'USA'],
  [/^redwood city/i, 'USA'],
  [/^foster city/i, 'USA'],
  [/^salt lake city/i, 'USA'],
  [/^santa monica/i, 'USA'],
  [/^irvine/i, 'USA'],
  [/^raleigh/i, 'USA'],
  [/^ann arbor/i, 'USA'],
  [/^scottsdale/i, 'USA'],
  [/^phoenix/i, 'USA'],
  [/^minneapolis/i, 'USA'],
  [/^long beach/i, 'USA'],
  [/^everett/i, 'USA'],
  [/^charlotte/i, 'USA'],
  [/^nashville/i, 'USA'],
  [/^columbus/i, 'USA'],
  [/^indianapolis/i, 'USA'],
  [/^detroit/i, 'USA'],
  [/^sacramento/i, 'USA'],
  [/^oakland/i, 'USA'],
  [/^cupertino/i, 'USA'],
  [/^santa clara/i, 'USA'],
  [/^burlingame/i, 'USA'],
  [/^bellevue/i, 'USA'],
  // International → country-level (consistent with USA)
  [/^london/i, 'UK'],
  [/^paris/i, 'France'],
  [/^berlin|^munich|^hamburg|^frankfurt/i, 'Germany'],
  [/^amsterdam|^rotterdam/i, 'Netherlands'],
  [/^dublin/i, 'Ireland'],
  [/^barcelona|^madrid/i, 'Spain'],
  [/^singapore/i, 'Singapore'],
  [/^tokyo|^osaka/i, 'Japan'],
  [/^sydney|^melbourne|^brisbane/i, 'Australia'],
  [/^toronto|^vancouver|^montreal|^ottawa|^calgary/i, 'Canada'],
  [/^bangalore|^bengaluru|^mumbai|^hyderabad|^noida|^gurgaon|^gurugram|^pune|^chennai/i, 'India'],
  [/^seoul/i, 'South Korea'],
  [/^tel aviv/i, 'Israel'],
  [/^stockholm/i, 'Sweden'],
  [/^copenhagen/i, 'Denmark'],
  [/^zurich|^zürich/i, 'Switzerland'],
  [/^lisbon/i, 'Portugal'],
  [/^prague/i, 'Czech Republic'],
  [/^warsaw/i, 'Poland'],
  [/^vienna/i, 'Austria'],
  [/^hong kong/i, 'Hong Kong'],
  [/^jakarta/i, 'Indonesia'],
  [/^bangkok/i, 'Thailand'],
  [/^manila/i, 'Philippines'],
  [/^kuala lumpur|^petaling jaya/i, 'Malaysia'],
  [/^buenos aires/i, 'Argentina'],
  [/^s[aã]o paulo/i, 'Brazil'],
  [/^mexico city/i, 'Mexico'],
  [/^cape town|^johannesburg/i, 'South Africa'],
  [/^dubai|^abu dhabi/i, 'UAE'],
  [/^helsinki/i, 'Finland'],
  [/^oslo/i, 'Norway'],
  [/^milan|^rome/i, 'Italy'],
  [/^brussels/i, 'Belgium'],
  [/^bucharest/i, 'Romania'],
  [/^taipei/i, 'Taiwan'],
  [/^ho chi minh/i, 'Vietnam'],
];

export function normalizeLocation(raw: string): string {
  if (!raw) return 'Remote';
  let loc = raw.trim();

  // Strip common suffixes/noise
  loc = loc
    .replace(/\s*\(HQ\)/gi, '')
    .replace(/\s*\(Hybrid\)/gi, '')
    .replace(/\s*\(Remote\)/gi, '')
    .replace(/\s*Office$/i, '')
    .replace(/\s*-\s*The\s+.*$/i, '')  // "London - The River Building HQ"
    .replace(/\s*HQ$/i, '')
    .trim();

  // Handle "Remote" variants
  const remoteMatch = loc.match(/^(?:Remote|Work from Home|WFH|Telecommute)/i);
  if (remoteMatch) {
    // "Remote - US" → "Remote (US)"
    const rest = loc.slice(remoteMatch[0].length).replace(/^[\s\-–:,]+/, '').replace(/^\(|\)$/g, '').trim();
    if (!rest) return 'Remote';
    // Normalize the country/region after "Remote"
    const country = COUNTRY_CODES[rest.toLowerCase()] || rest;
    if (/^u\.?s\.?a?\.?$|^united states$/i.test(country)) return 'Remote (USA)';
    return `Remote (${country})`;
  }
  // "United States - Remote" / "US Remote" etc.
  if (/remote$/i.test(loc) || /^remote/i.test(loc)) {
    const cleaned = loc.replace(/[\s\-–]*remote[\s\-–]*/gi, '').trim();
    if (!cleaned || /^u\.?s\.?a?\.?$|^united states$/i.test(cleaned)) return 'Remote (USA)';
    return `Remote (${cleaned})`;
  }

  // Handle "US-CA-Menlo Park" pattern
  const usDashMatch = loc.match(/^US-[A-Z]{2}-(.+)$/);
  if (usDashMatch) loc = usDashMatch[1];

  // Handle "US - San Francisco" / "UK - London" pattern
  const prefixMatch = loc.match(/^(?:US|USA|UK|SG|AU|CA|DE|FR)\s*[-–]\s*(.+)$/i);
  if (prefixMatch) loc = prefixMatch[1];

  const lower = loc.toLowerCase().trim();

  // Exact match
  if (EXACT_MAP[lower]) return EXACT_MAP[lower];

  // City pattern matching
  for (const [pattern, city] of CITY_PATTERNS) {
    if (pattern.test(loc)) return city;
  }

  // Handle "City, STATE/Country" — strip redundant qualifiers
  const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = parts[0];
    const qualifier = parts[parts.length - 1].toLowerCase().trim();

    // "Singapore, Singapore" / "Singapore, sg" → "Singapore"
    if (city.toLowerCase() === qualifier || COUNTRY_CODES[qualifier] === city) return city;

    // "City, CA" / "City, TX" etc. → "USA" (any US state code)
    if (US_STATES[qualifier]) {
      return 'USA';
    }

    // "City, USA" / "City, United States"
    if (/^usa?$|^united states$/i.test(qualifier)) {
      return 'USA';
    }

    // "City, country code" → "City"
    if (COUNTRY_CODES[qualifier]) {
      for (const [pattern, canonicalCity] of CITY_PATTERNS) {
        if (pattern.test(city)) return canonicalCity;
      }
      // Not a known city pattern, return "City" clean
      return parts[0];
    }

    // "City, State, USA" → just "City"
    if (parts.length >= 3) {
      for (const [pattern, canonicalCity] of CITY_PATTERNS) {
        if (pattern.test(parts[0])) return canonicalCity;
      }
    }
  }

  // Multi-location (semicolons, pipes) → take first
  if (loc.includes(';') || loc.includes('|') || loc.includes('•')) {
    const first = loc.split(/[;|•]/)[0].trim();
    return normalizeLocation(first);  // recurse on first location
  }

  // Fallback: return first part (before comma) if reasonable
  if (parts[0] && parts[0].length < 40 && !/\/|http/.test(parts[0])) {
    return parts[0];
  }

  return loc;
}
