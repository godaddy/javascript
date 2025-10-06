import { allCountries, countryTuples } from "./country-region-data";

export interface Country {
	label: string;
	value: string;
}

export const countries: Country[] = countryTuples.map(([label, value]) => ({
	label,
	value,
}));

export function hasRegionData(countryCode: string): boolean {
	const countryData = allCountries.find(
		(country) => country[1] === countryCode,
	);
	return !!(
		countryData?.[2] &&
		Array.isArray(countryData[2]) &&
		countryData[2].length > 0
	);
}

export function getRegions(
	countryCode: string,
): { label: string; code: string }[] {
	const countryData = allCountries.find(
		(country) => country[1] === countryCode,
	);

	if (!countryData || !countryData[2] || !Array.isArray(countryData[2])) {
		return [];
	}

	return countryData[2].map((region: string[]) => ({
		label: region[0],
		code: region[1],
	}));
}
