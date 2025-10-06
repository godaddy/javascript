// Heavily influenced by the great work of https://github.com/bendrucker/creditcards-types
import type { NestedPartial } from "./types";

// @see https://github.com/godaddy-wordpress/wc-plugin-framework/blob/c74b202cd8290e31c3c73f0de22178d136426a6f/woocommerce/payment-gateway/class-sv-wc-payment-gateway-helper.php#L43-L68
export const CardTypes = {
	AMERICAN_EXPRESS: "amex",
	DINERS_CLUB: "dinersclub",
	DISCOVER: "discover",
	JCB: "jcb",
	MAESTRO: "maestro",
	MASTERCARD: "mastercard",
	UNIONPAY: "unionpay",
	VISA: "visa",
} as const;

export type CardType = (typeof CardTypes)[keyof typeof CardTypes];
export type CardProfiles = typeof cardProfiles;

export const cardProfiles = {
	[CardTypes.AMERICAN_EXPRESS]: {
		id: CardTypes.AMERICAN_EXPRESS,
		name: "American Express" as const,
		digits: 15,
		pattern: /^3[47]\d{13}$/,
		eagerPattern: /^3[47]/,
		groupPattern: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
		cvcLength: 4,
		luhn: true,
		icon: "amex.svg",
	},
	[CardTypes.DINERS_CLUB]: {
		id: CardTypes.DINERS_CLUB,
		name: "Diners Club" as const,
		digits: [14, 19],
		pattern: /^3(0[0-5]|[68]\d)\d{11,16}$/,
		eagerPattern: /^3(0|[68])/,
		groupPattern: /(\d{1,4})?(\d{1,6})?(\d{1,9})?/,
		cvcLength: 4,
		luhn: true,
		icon: "diners.svg",
	},
	[CardTypes.DISCOVER]: {
		id: CardTypes.DISCOVER,
		name: "Discover" as const,
		digits: 16,
		pattern:
			/^6(011(0[0-9]|[2-4]\d|74|7[7-9]|8[6-9]|9[0-9])|4[4-9]\d{3}|5\d{4})\d{10}$/,
		eagerPattern: /^6(011(0[0-9]|[2-4]|74|7[7-9]|8[6-9]|9[0-9])|4[4-9]|5)/,
		groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
		cvcLength: 3,
		luhn: true,
		icon: "discover.svg",
	},
	[CardTypes.JCB]: {
		id: CardTypes.JCB,
		name: "JCB" as const,
		digits: 16,
		pattern: /^35\d{14}$/,
		eagerPattern: /^35/,
		groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
		cvcLength: 3,
		luhn: true,
		icon: "jcb.svg",
	},
	[CardTypes.UNIONPAY]: {
		id: CardTypes.UNIONPAY,
		name: "UnionPay" as const,
		digits: 16,
		pattern: /^62[0-5]\d{13,16}$/,
		eagerPattern: /^62/,
		groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
		cvcLength: 3,
		luhn: false,
		icon: "unionpay.svg",
	},
	[CardTypes.MAESTRO]: {
		id: CardTypes.MAESTRO,
		name: "Maestro" as const,
		digits: [12, 19],
		pattern:
			/^(?:5[06789]\d\d|(?!6011[0234])(?!60117[4789])(?!60118[6789])(?!60119)(?!64[456789])(?!65)6\d{3})\d{8,15}$/,
		eagerPattern:
			/^(5(018|0[23]|[68])|6[37]|60111|60115|60117([56]|7[56])|60118[0-5]|64[0-3]|66)/,
		groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
		cvcLength: 3,
		luhn: true,
		icon: "maestro.svg",
	},
	[CardTypes.MASTERCARD]: {
		id: CardTypes.MASTERCARD,
		name: "MasterCard" as const,
		digits: 16,
		pattern:
			/^(5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)\d{12}$/,
		eagerPattern: /^(2[3-7]|22[2-9]|5[1-5])/,
		groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/,
		cvcLength: 3,
		luhn: true,
		icon: "mastercard.svg",
	},
	[CardTypes.VISA]: {
		id: CardTypes.VISA,
		name: "Visa" as const,
		digits: [13, 19],
		pattern: /^4\d{12}(\d{3}|\d{6})?$/,
		eagerPattern: /^4/,
		groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
		cvcLength: 3,
		luhn: true,
		icon: "visa.svg",
	},
};

/**
 * Checks if a given credit card number is valid using the Luhn algorithm.
 */
export function isLuhnValid({ cardNumber }: { cardNumber: string }) {
	const cleanedCardNumber = cardNumber.replace(/ /g, "");
	const luhnArray = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];
	let bit = 1;
	let sum = 0;
	let value: number;

	for (let i = cleanedCardNumber.length; i--; i >= 0) {
		value = Number.parseInt(cleanedCardNumber.charAt(i), 10);
		bit ^= 1;
		sum += bit ? luhnArray[value] : value;
	}

	return sum % 10 === 0;
}

/**
 * Get the type of credit card based on its (full or partial) number.
 */
export function getCardType({
	cardNumber,
	eager = false,
	supportedCardProfiles = cardProfiles,
}: {
	cardNumber: string;
	eager?: boolean;
	supportedCardProfiles?: Partial<CardProfiles>;
}) {
	return Object.values(supportedCardProfiles).find((cardProfile) => {
		const searchPattern = eager
			? cardProfile.eagerPattern
			: cardProfile.pattern;
		return new RegExp(searchPattern).test(cardNumber);
	})?.id;
}

/**
 * Retrieves the profile of a card type based on the provided card number or card type.
 */
export function getCardProfile({
	cardNumber,
	cardType,
	eager = false,
	supportedCardProfiles = cardProfiles,
}: {
	cardNumber?: string;
	cardType?: CardType;
	eager?: boolean;
	supportedCardProfiles?: Partial<CardProfiles>;
}) {
	if (!cardNumber && !cardType)
		throw new Error("Need at least cardNumber or cardType");

	cardType ??= cardNumber ? getCardType({ cardNumber, eager }) : undefined;

	return Object.values(supportedCardProfiles).find(
		(cardProfile) => cardProfile.id === cardType,
	);
}

/**
 * Retrieves the card groups based on the given card number.
 *
 * The card groups are the card number split into groups of digits, separated by spaces.
 */
export function getCardGroups({
	cardNumber,
	supportedCardProfiles = cardProfiles,
}: {
	cardNumber?: string;
	supportedCardProfiles?: Partial<CardProfiles>;
}) {
	if (!cardNumber) return [];

	const cardProfile = getCardProfile({
		cardNumber,
		eager: true,
		supportedCardProfiles: supportedCardProfiles,
	});

	if (!cardProfile || !cardProfile.groupPattern) return [];

	return cardNumber
		.match(cardProfile.groupPattern)
		?.slice(1)
		?.filter((group) => Boolean(group));
}

/**
 * Determines if a given card number is valid for a specified card type.
 */
export function isValidCardType({
	cardNumber,
	cardType,
	cardProfile,
}: {
	cardNumber: string;
	cardType: CardType;
	cardProfile?: ReturnType<typeof getCardProfile>;
}) {
	const cleanedCardNumber = cardNumber.replace(/ /g, "");
	cardProfile ??= getCardProfile({ cardNumber: cleanedCardNumber, cardType });

	if (!cardProfile || !cardProfile.pattern) return false;

	return new RegExp(cardProfile.pattern).test(cleanedCardNumber);
}

/**
 * Checks if a given card number is valid based on the Luhn algorithm and card type.
 *
 * @link https://www.dcode.fr/luhn-algorithm
 */
export function isValidCard({
	cardNumber,
	cardProfile,
}: {
	cardNumber: string;
	cardProfile?: ReturnType<typeof getCardProfile>;
}) {
	if (!cardNumber) return false;

	cardProfile ??= getCardProfile({ cardNumber });

	if (!cardProfile) return false;

	return (
		!cardProfile?.luhn ||
		(isLuhnValid({ cardNumber }) &&
			isValidCardType({
				cardNumber,
				cardType: cardProfile.id,
				cardProfile,
			}))
	);
}

/**
 * Sets up the card information for a gateway and returns an object with different methods for accessing card-related information.
 *
 * Allows gateway to override the supported card types and profile information.
 */
export function setupCardInfo({
	supportedCardTypes = Object.keys(cardProfiles) as CardType[],
	cardProfileOverrides = {},
}: {
	supportedCardTypes?: CardType[];
	cardProfileOverrides?: NestedPartial<CardProfiles>;
}) {
	// apply configuration overrides and filter out unsupported card types
	const supportedCardProfiles = Object.fromEntries(
		Object.entries({
			...cardProfiles,
			...cardProfileOverrides,
		}).filter(([key]) => supportedCardTypes?.includes(key as CardType)),
	) as Partial<CardProfiles>;

	return {
		getCardType: ({
			cardNumber,
			eager = false,
		}: {
			cardNumber: string;
			eager?: boolean;
		}) => getCardType({ cardNumber, eager, supportedCardProfiles }),

		getCardProfile: ({
			cardNumber,
			cardType,
			eager = false,
		}: {
			cardNumber?: string;
			cardType?: CardType;
			eager?: boolean;
		}) =>
			getCardProfile({ cardNumber, cardType, eager, supportedCardProfiles }),

		getCardGroups: ({ cardNumber }: { cardNumber: string }) =>
			getCardGroups({ cardNumber, supportedCardProfiles }),

		isValidCardType,
		isValidCard,
	};
}
