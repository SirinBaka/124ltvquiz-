import { describe, it, expect } from 'vitest';
import { insertSnippetAtCursor, buildCatalystEquation } from './scientificHelper';

describe('insertSnippetAtCursor', () => {
  it('inserts snippet at cursor position when no text is selected and sets cursor after insertion', () => {
    const original = 'Cho tam giac ABC';
    const snippet = ' $x$';
    const result = insertSnippetAtCursor(original, 16, 16, snippet);
    expect(result).toEqual({
      text: 'Cho tam giac ABC $x$',
      cursorIndex: 20
    });
  });

  it('inserts snippet with cursor placeholder and positions cursor at the placeholder', () => {
    const original = 'Gia tri ';
    const snippet = '$\\frac{|b}{c}$';
    const result = insertSnippetAtCursor(original, 8, 8, snippet);
    expect(result).toEqual({
      text: 'Gia tri $\\frac{b}{c}$',
      cursorIndex: 15
    });
  });

  it('wraps selected text when placeholder is present', () => {
    const original = 'Xet bieu thuc x + 1 trong can';
    const result = insertSnippetAtCursor(original, 14, 19, '$\\sqrt{|}$');
    expect(result).toEqual({
      text: 'Xet bieu thuc $\\sqrt{x + 1}$ trong can',
      cursorIndex: 26
    });
  });

  it('replaces selected text when no placeholder is present', () => {
    const original = 'Chon ket qua dung: A';
    const result = insertSnippetAtCursor(original, 19, 20, 'B');
    expect(result).toEqual({
      text: 'Chon ket qua dung: B',
      cursorIndex: 20
    });
  });

  it('handles empty original text', () => {
    const result = insertSnippetAtCursor('', 0, 0, '$\\alpha$');
    expect(result).toEqual({
      text: '$\\alpha$',
      cursorIndex: 8
    });
  });
});

describe('buildCatalystEquation', () => {
  it('builds mhchem single arrow with top temperature condition and bottom catalyst', () => {
    const result = buildCatalystEquation({
      type: 'single',
      reactants: '2H2 + O2',
      products: '2H2O',
      conditionTop: 't^\\circ',
      conditionBottom: 'xt',
      format: 'mhchem'
    });
    expect(result).toEqual('\\ce{2H2 + O2 ->[t^\\circ][xt] 2H2O}');
  });

  it('builds mhchem reversible arrow with top and bottom conditions', () => {
    const result = buildCatalystEquation({
      type: 'reversible',
      reactants: 'N2 + 3H2',
      products: '2NH3',
      conditionTop: 't^\\circ, p',
      conditionBottom: 'Fe',
      format: 'mhchem'
    });
    expect(result).toEqual('\\ce{N2 + 3H2 <=>[t^\\circ, p][Fe] 2NH3}');
  });

  it('builds latex xrightarrow when format is latex', () => {
    const result = buildCatalystEquation({
      type: 'single',
      reactants: 'A + B',
      products: 'C',
      conditionTop: 't^\\circ',
      conditionBottom: 'xt',
      format: 'latex'
    });
    expect(result).toEqual('A + B \\xrightarrow[\\text{xt}]{t^\\circ} C');
  });

  it('builds standalone arrow snippet when reactants and products are omitted', () => {
    const result = buildCatalystEquation({
      type: 'single',
      conditionTop: 't^\\circ',
      conditionBottom: 'xt',
      format: 'mhchem'
    });
    expect(result).toEqual('\\ce{->[t^\\circ][xt]}');
  });

  it('wraps non-ASCII Vietnamese catalyst conditions in \\text{} for mhchem', () => {
    const result = buildCatalystEquation({
      type: 'single',
      reactants: '6CO2 + 6H2O',
      products: 'C6H12O6 + 6O2 ^',
      conditionTop: 'as',
      conditionBottom: 'diệp lục',
      format: 'mhchem'
    });
    expect(result).toEqual('\\ce{6CO2 + 6H2O ->[as][\\text{diệp lục}] C6H12O6 + 6O2 ^}');
  });
});

describe('normalizeScientificText', () => {
  it('wraps standalone \\ce{...} with $ if not already wrapped', async () => {
    const { normalizeScientificText } = await import('./scientificHelper');
    const input = 'Phan ung \\ce{2H2 + O2 ->[t^\\circ] 2H2O} xay ra nhanh.';
    const output = normalizeScientificText(input);
    expect(output).toEqual('Phan ung $\\ce{2H2 + O2 ->[t^\\circ] 2H2O}$ xay ra nhanh.');
  });

  it('does not double wrap \\ce{...} that is already inside $...$', async () => {
    const { normalizeScientificText } = await import('./scientificHelper');
    const input = 'Phan ung $\\ce{2H2 + O2 -> 2H2O}$ da co.';
    const output = normalizeScientificText(input);
    expect(output).toEqual('Phan ung $\\ce{2H2 + O2 -> 2H2O}$ da co.');
  });
});

