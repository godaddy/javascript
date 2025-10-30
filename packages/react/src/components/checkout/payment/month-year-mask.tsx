// @ts-expect-error
const matcher = /(?<month>\d{0,2})(?<separator>\s?\/?\s?)(?<year>\d{0,2})/;
export function monthYearMask({ value }: { value?: string }) {
  if (typeof value !== 'string') {
    return '';
  }

  const matches = matcher.exec(value);

  let month = matches?.groups?.month;
  let separator = matches?.groups?.separator;
  let year = matches?.groups?.year;

  // no months start with >2 so auto add the 0
  if (month && month?.length === 1 && Number.parseInt(month, 10) >= 2) {
    month = `0${month}`;
  }

  // if the user is deleting things we remove the separator
  if (separator === ' /') {
    separator = '';
  }
  // otherwise the user is adding things so we add the separator
  else if (month?.length === 2) {
    separator = ' / ';
  }

  // user adds 1/ => split into M = 01 Y = ''
  if (month === '1' && separator === '/') {
    month = '01';
    separator = ' / ';
  }

  // is MM = 14 and Y = '' => split into M = 1 Y = 4
  // and add in the separator
  if (month?.length === 2 && Number.parseInt(month, 10) > 12) {
    year = month[1];
    month = `0${month[0]}`;
    separator = ' / ';
  }

  // there shouldn't be a separator by itself
  if (separator === '/') {
    separator = '';
  }

  const maskedValue = `${month}${separator}${year ? `${year}` : ''}`;

  return maskedValue;
}

export function parseMMYY({ value }: { value?: string }) {
  if (typeof value !== 'string') {
    return { month: '', year: '' };
  }

  const matches = matcher.exec(value);

  return {
    month: matches?.groups?.month,
    year: matches?.groups?.year,
  };
}
