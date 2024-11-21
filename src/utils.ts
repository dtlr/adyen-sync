export const posWrkIds = ["21", "22", "23", "24", "25", "26", "27", "28", "29"];

export const storeRefPattern = /^([A-Z]+)(\d+)$/;

export const parseStoreRef = (reference: string) => {
  const match = reference.match(storeRefPattern);
  if (!match) return null;

  const [_, letters, numbers] = match;
  return {
    prefix: letters,
    number: numbers,
  };
};

export const findDifference = (arr1: string[], arr2: string[]): string[] => {
  return arr1.filter((item) => !arr2.includes(item));
};

export const customLogger = (
  message: string,
  requestId: string,
  ...rest: string[]
) => {
  const jsonObj = {
    requestId,
    message,
    extra_info: rest ?? [],
  };
  console.log("%j", jsonObj);
};
