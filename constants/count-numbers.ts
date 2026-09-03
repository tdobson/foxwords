export interface CountNumber {
  value: number;
  slug: string;
  name: string;
}

export const COUNT_NUMBERS: CountNumber[] = [
  { value: 1, slug: 'one', name: 'One' },
  { value: 2, slug: 'two', name: 'Two' },
  { value: 3, slug: 'three', name: 'Three' },
  { value: 4, slug: 'four', name: 'Four' },
  { value: 5, slug: 'five', name: 'Five' },
  { value: 6, slug: 'six', name: 'Six' },
  { value: 7, slug: 'seven', name: 'Seven' },
  { value: 8, slug: 'eight', name: 'Eight' },
  { value: 9, slug: 'nine', name: 'Nine' },
  { value: 10, slug: 'ten', name: 'Ten' },
  { value: 11, slug: 'eleven', name: 'Eleven' },
  { value: 12, slug: 'twelve', name: 'Twelve' },
  { value: 13, slug: 'thirteen', name: 'Thirteen' },
  { value: 14, slug: 'fourteen', name: 'Fourteen' },
  { value: 15, slug: 'fifteen', name: 'Fifteen' },
  { value: 16, slug: 'sixteen', name: 'Sixteen' },
  { value: 17, slug: 'seventeen', name: 'Seventeen' },
  { value: 18, slug: 'eighteen', name: 'Eighteen' },
  { value: 19, slug: 'nineteen', name: 'Nineteen' },
  { value: 20, slug: 'twenty', name: 'Twenty' },
];

export function getCountNumberSlug(value: number): string | undefined {
  return COUNT_NUMBERS.find((item) => item.value === value)?.slug;
}
