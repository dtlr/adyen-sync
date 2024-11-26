import { describe, it, expect, suite } from 'vitest'
import { findDifference, parseStoreRef } from '../src/utils.js'

suite('utils', () => {
  describe('parseStoreRef', () => {
    it.each([
      { input: 'DTLR4105', expected: { prefix: 'DTLR', number: '4105' } },
      { input: 'SPC1001', expected: { prefix: 'SPC', number: '1001' } },
      { input: 'DTLR0023', expected: { prefix: 'DTLR', number: '0023' } },
      { input: 'DTLR3002', expected: { prefix: 'DTLR', number: '3002' } },
      { input: 'DTLR0025', expected: { prefix: 'DTLR', number: '0025' } },
      { input: 'DTLR0026', expected: { prefix: 'DTLR', number: '0026' } },
      { input: 'DTLR0027', expected: { prefix: 'DTLR', number: '0027' } },
      { input: 'DTLR0028', expected: { prefix: 'DTLR', number: '0028' } },
      { input: 'DTLR0029', expected: { prefix: 'DTLR', number: '0029' } },
    ])('should parse brand and store number correctly', ({ input, expected }) => {
      const result = parseStoreRef(input)
      expect(result).toEqual(expected)
    })
  })
  describe('findDifference', () => {
    it.each([
      { arr1: ['a', 'b', 'c'], arr2: ['a', 'b', 'd'], expected: ['c'] },
      { arr1: ['a', 'b', 'c'], arr2: ['a', 'b', 'c'], expected: [] },
      { arr1: ['a', 'b', 'c'], arr2: ['a', 'b', 'd', 'e'], expected: ['c'] },
    ])('should find what is in arr1 but not in arr2', ({ arr1, arr2, expected }) => {
      const result = findDifference(arr1, arr2)
      expect(result).toEqual(expected)
    })
  })
})
