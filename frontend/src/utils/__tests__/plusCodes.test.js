/**
 * Tests for the offline Plus Code (Open Location Code) encoder.
 *
 * These assert the FULL canonical code (not just the prefix) against
 * Google's reference encoder for known landmarks. Plus Codes are precise —
 * tolerance is exact.
 */
import { describe, it, expect } from 'vitest';
import { encodePlusCode, gMapsLink } from '../plusCodes';

describe('encodePlusCode — format invariants', () => {
  it('returns an 11-character string with "+" at position 8', () => {
    const code = encodePlusCode(13.0827, 80.2707);
    expect(code).toHaveLength(11);
    expect(code[8]).toBe('+');
  });

  it('uses only the OLC alphabet 23456789CFGHJMPQRVWX', () => {
    const stripped = encodePlusCode(13.0827, 80.2707).replace('+', '');
    expect(stripped).toMatch(/^[23456789CFGHJMPQRVWX]+$/);
  });

  it('returns the empty string for non-numeric or non-finite inputs', () => {
    expect(encodePlusCode(NaN, 0)).toBe('');
    expect(encodePlusCode(Infinity, 0)).toBe('');
    expect(encodePlusCode('foo', 0)).toBe('');
    expect(encodePlusCode(null, 80)).toBe('');
  });
});

describe('encodePlusCode — exact canonical codes', () => {
  // Verified against github.com/google/open-location-code reference encoder.
  const cases = [
    ['Chennai',            13.0827,  80.2707,  '7M5237MC+37'],
    ['Bengaluru',          12.9716,  77.5946,  '7J4VXHCV+JR'],
    ['New Delhi',          28.6139,  77.2090,  '7JWVJ675+HJ'],
    ['London',             51.5074,  -0.1278,  '9C3XGV4C+XV'],
    ['Sydney Opera House', -33.8568, 151.2153, '4RRH46V8+74'],
    ['Equator / Prime',    0,        0,        '6FG22222+22'],
  ];
  it.each(cases)('%s encodes to %s', (_name, lat, lon, expected) => {
    expect(encodePlusCode(lat, lon)).toBe(expected);
  });
});

describe('encodePlusCode — grid refinement actually works', () => {
  it('distinguishes points ~55 m apart within the same 14 m grid block', () => {
    const a = encodePlusCode(13.0827, 80.2707); // 7M5237MC+37
    const b = encodePlusCode(13.0832, 80.2707); // 7M5237MC+77
    expect(a.slice(0, 8)).toBe(b.slice(0, 8)); // same coarse cell
    expect(a).not.toBe(b);                      // but the grid tail differs
    expect(a.slice(-2)).not.toBe('XX');         // regression guard for the old bug
  });

  it('is deterministic', () => {
    expect(encodePlusCode(13.0827, 80.2707)).toBe(encodePlusCode(13.0827, 80.2707));
  });

  it('clamps and wraps out-of-range coordinates without error', () => {
    expect(encodePlusCode(95, 0)).toHaveLength(11);
    expect(encodePlusCode(0, 200)).toHaveLength(11);
    expect(encodePlusCode(0, -200)).toHaveLength(11);
  });
});

describe('gMapsLink', () => {
  it('builds a Google Maps URL with 6 decimal places', () => {
    expect(gMapsLink(13.0827, 80.2707))
      .toBe('https://maps.google.com/?q=13.082700,80.270700');
  });
});
