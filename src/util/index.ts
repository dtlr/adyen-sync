import { init } from '@paralleldrive/cuid2'
import { STOREREFPATTERN } from '@/constants.js'

export const parseStoreRef = (reference: string) => {
  const match = reference.match(STOREREFPATTERN)
  if (!match) return null

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, letters, numbers] = match
  return {
    prefix: letters,
    number: numbers,
  }
}

export const findDifference = (arr1: string[], arr2: string[]): string[] => {
  return arr1.filter((item) => !arr2.includes(item))
}

export const createRequestID = () => {
  return init({
    random: Math.random,
    length: 32,
  })()
}
