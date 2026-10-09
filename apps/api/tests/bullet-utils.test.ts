import { describe, it, expect } from 'vitest';
import { consolidateBullets } from '../src/modules/tailoring/utils/bullet-utils';

describe('consolidateBullets utility', () => {
  it('returns empty array on empty or falsy inputs', () => {
    expect(consolidateBullets(null)).toEqual([]);
    expect(consolidateBullets(undefined)).toEqual([]);
    expect(consolidateBullets([])).toEqual([]);
    expect(consolidateBullets(['   ', ''])).toEqual([]);
  });

  it('merges lines that wrap mid-sentence with lowercase letters', () => {
    const raw = [
      'Developed production-grade frontend interfaces and reusable component libraries using React and TypeScript,',
      'establishing shared design patterns and type-safe contracts adopted across 8+ company-wide projects',
    ];
    const result = consolidateBullets(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Developed production-grade frontend interfaces and reusable component libraries using React and TypeScript, establishing shared design patterns and type-safe contracts adopted across 8+ company-wide projects'
    );
  });

  it('merges lines broken with hyphens (e.g. Object- + Oriented)', () => {
    const raw = [
      'Relevant Coursework: Data Structures & Algorithms, Database Systems, Software Engineering, Object-',
      'Oriented',
      'Programming',
    ];
    const result = consolidateBullets(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Relevant Coursework: Data Structures & Algorithms, Database Systems, Software Engineering, Object-Oriented Programming'
    );
  });

  it('merges lines ending with prepositions or conjunctions', () => {
    const raw = [
      'Drove sprint delivery across 6+ concurrent platform builds (IoT, LMS, HMS, HRIS, Inventory, Order Management) in',
      'an Agile environment using GitHub Projects and a custom-built PMS, accelerating delivery velocity through AI-',
      'assisted prototyping and scaffolding with Claude Opus 5, Codex, Grok Build, and Gemini 3.1 Pro',
    ];
    const result = consolidateBullets(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'Drove sprint delivery across 6+ concurrent platform builds (IoT, LMS, HMS, HRIS, Inventory, Order Management) in an Agile environment using GitHub Projects and a custom-built PMS, accelerating delivery velocity through AI-assisted prototyping and scaffolding with Claude Opus 5, Codex, Grok Build, and Gemini 3.1 Pro'
    );
  });

  it('keeps distinct action verb sentences as separate bullets', () => {
    const raw = [
      'Designed backend data models (MongoDB/Prisma) that unified contracts.',
      'Developed production-grade frontend interfaces and reusable components.',
      'Integrated smart door locks and IoT gateways via REST APIs.',
    ];
    const result = consolidateBullets(raw);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Designed backend data models (MongoDB/Prisma) that unified contracts.');
    expect(result[1]).toBe('Developed production-grade frontend interfaces and reusable components.');
    expect(result[2]).toBe('Integrated smart door locks and IoT gateways via REST APIs.');
  });

  it('keeps module titles prefixed with em-dash as separate bullets', () => {
    const raw = [
      'Integrated smart door locks into a centralized React dashboard with sub-500ms response latency',
      'HRIS (Bandai Namco) — Built and shipped admin, HR, and employee surfaces covering employee lifecycle,',
      'payroll/payslips, attendance with Hikvision biometric device integration, leave/benefits, schedules, and BIR',
      'reporting using React/TypeScript and a Node/Prisma API, with multi-environment delivery via GitOps',
      '(DEV/UAT/PROD)',
    ];
    const result = consolidateBullets(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(
      'Integrated smart door locks into a centralized React dashboard with sub-500ms response latency'
    );
    expect(result[1]).toContain('HRIS (Bandai Namco) — Built and shipped admin');
    expect(result[1]).toContain('(DEV/UAT/PROD)');
  });

  it('handles multiline strings with embedded newlines', () => {
    const raw = [
      'Built a multi-tenant hotel management system enabling organizations to manage rooms, pricing, users, and\nreservations with tenant-isolated data architecture',
      'Designed and implemented core booking functionality including room type configuration, dynamic pricing rules,\nand full reservation lifecycle management from search to checkout',
    ];
    const result = consolidateBullets(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(
      'Built a multi-tenant hotel management system enabling organizations to manage rooms, pricing, users, and reservations with tenant-isolated data architecture'
    );
    expect(result[1]).toBe(
      'Designed and implemented core booking functionality including room type configuration, dynamic pricing rules, and full reservation lifecycle management from search to checkout'
    );
  });

  it('strips leading bullet characters and list numbers cleanly', () => {
    const raw = [
      '• First bullet point with bullet glyph',
      '- Second bullet point with hyphen',
      '1. Third bullet point with number',
    ];
    const result = consolidateBullets(raw);
    expect(result).toEqual([
      'First bullet point with bullet glyph',
      'Second bullet point with hyphen',
      'Third bullet point with number',
    ]);
  });
});
