/**
 * Structural invariant checks between an English source article and its
 * translation (ADR-0001: CI enforces deterministic checks; the translation
 * report records the outcome of the same comparison after a run).
 *
 * Numbers follow the project's numeric equivalence rule: a source token is
 * interpreted with the English convention (`,` thousands, `.` decimal), a
 * target token with the target language's convention (`.` thousands, `,`
 * decimal for de/es); the values must match. Version-like tokens (two or
 * more dots, e.g. `1.0.2`) must be copied verbatim, and tokens that cannot
 * be interpreted under the target convention are reported as ambiguous
 * instead of failing the invariant.
 */

const NUMBER_TOKEN_PATTERN = /\d[\d.,]*/g;

/**
 * Numeric tokens in a text: digit runs with optional `,`/`.` separators.
 * Trailing separators (sentence punctuation) are trimmed; hyphenated
 * ISO dates decompose into their plain-number components, which keeps
 * `2026-09-24` comparable across languages.
 */
export function extractNumberTokens(text) {
  const tokens = [];
  for (const raw of text.match(NUMBER_TOKEN_PATTERN) ?? []) {
    const token = raw.replace(/[.,]+$/, '');
    if (token !== '') {
      tokens.push(token);
    }
  }
  return tokens;
}

/**
 * Parses one numeric token under a convention (`'en'` or `'de'`/`'es'`).
 * Returns `{ kind: 'value', value }`, `{ kind: 'version' }` (strict string
 * comparison), or `{ kind: 'ambiguous' }`.
 */
export function parseNumberToken(token, convention) {
  const dots = (token.match(/\./g) ?? []).length;
  const commas = (token.match(/,/g) ?? []).length;

  if (dots >= 2) {
    return { kind: 'version' };
  }
  const decimalSeparator = convention === 'en' ? '.' : ',';
  const thousandsSeparator = convention === 'en' ? ',' : '.';
  const decimalPattern = new RegExp(`^\\d+\\${decimalSeparator}\\d+$`);
  const thousandsPattern = new RegExp(`^\\d{1,3}(\\${thousandsSeparator}\\d{3})+$`);
  const mixedPattern = new RegExp(
    `^(\\d{1,3}(\\${thousandsSeparator}\\d{3})+|\\d+)\\${decimalSeparator}\\d+$`,
  );

  if (dots >= 1 && commas >= 1) {
    if (mixedPattern.test(token)) {
      return { kind: 'value', value: parseValue(token, convention) };
    }
    return { kind: 'ambiguous' };
  }
  if (dots === 1 && commas === 0) {
    if (decimalPattern.test(token)) {
      return { kind: 'value', value: parseValue(token, convention) };
    }
    if (convention === 'en' && thousandsPattern.test(token)) {
      return { kind: 'ambiguous' };
    }
    if (convention !== 'en' && thousandsPattern.test(token)) {
      return { kind: 'value', value: parseValue(token, convention) };
    }
    return { kind: 'ambiguous' };
  }
  if (dots === 0 && commas >= 1) {
    if (decimalPattern.test(token)) {
      return { kind: 'value', value: parseValue(token, convention) };
    }
    if (convention === 'en' && thousandsPattern.test(token)) {
      return { kind: 'value', value: parseValue(token, convention) };
    }
    if (convention !== 'en' && commas >= 2 && thousandsPattern.test(token)) {
      return { kind: 'ambiguous' };
    }
    return { kind: 'ambiguous' };
  }
  return { kind: 'value', value: parseValue(token, convention) };
}

function strip(token, separator) {
  return token.split(separator).join('');
}

/**
 * Interprets one token under a convention: strips the thousands separator,
 * then normalizes the decimal separator to `.` for `Number`.
 */
function parseValue(token, convention) {
  const thousandsSeparator = convention === 'en' ? ',' : '.';
  const decimalSeparator = convention === 'en' ? '.' : ',';
  const withoutThousands = strip(token, thousandsSeparator);
  return Number(withoutThousands.split(decimalSeparator).join('.'));
}

function countMultiset(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function multisetEqual(left, right) {
  if (left.size !== right.size) {
    return false;
  }
  for (const [value, count] of left) {
    if (right.get(value) !== count) {
      return false;
    }
  }
  return true;
}

/**
 * Numeric invariant: token multisets must carry the same numeric values
 * (convention-adjusted) and the same version-like tokens, verbatim.
 *
 * Ambiguous tokens follow the project's numeric rule: they act as review
 * warnings, not failures. An ambiguous target token can absorb one source
 * value (and an ambiguous source token one target value) without failing
 * the invariant; every absorbed value is reported in `ambiguous` for human
 * review. Genuinely changed values (no ambiguity to absorb them) fail.
 */
export function compareNumbers(sourceText, targetText, { targetLanguage, sourceLanguage = 'en' }) {
  const violations = [];

  const collect = (text, convention) => {
    const values = [];
    const versions = [];
    const ambiguous = [];
    for (const token of extractNumberTokens(text)) {
      const parsed = parseNumberToken(token, convention);
      if (parsed.kind === 'value') {
        values.push(parsed.value);
      } else if (parsed.kind === 'version') {
        versions.push(token);
      } else {
        ambiguous.push({ token, convention });
      }
    }
    return { values, versions, ambiguous };
  };

  const source = collect(sourceText, sourceLanguage);
  const target = collect(targetText, targetLanguage);

  const sourceCounts = countMultiset(source.values);
  const targetCounts = countMultiset(target.values);

  const missingValues = [];
  for (const [value, count] of sourceCounts) {
    const deficit = count - (targetCounts.get(value) ?? 0);
    for (let index = 0; index < deficit; index += 1) {
      missingValues.push(value);
    }
  }
  const extraValues = [];
  for (const [value, count] of targetCounts) {
    const surplus = count - (sourceCounts.get(value) ?? 0);
    for (let index = 0; index < surplus; index += 1) {
      extraValues.push(value);
    }
  }

  // An ambiguous token can stand in for one unmatched value on the other
  // side; anything left over after absorbing is a real value change.
  if (missingValues.length > target.ambiguous.length || extraValues.length > source.ambiguous.length) {
    const sourceSummary = [...sourceCounts].map(([v, c]) => `${v}x${c}`).join(', ') || '(none)';
    const targetSummary = [...targetCounts].map(([v, c]) => `${v}x${c}`).join(', ') || '(none)';
    violations.push(
      `numeric values differ between source (${sourceSummary}) and translation (${targetSummary})`,
    );
  }

  if (!multisetEqual(countMultiset(source.versions), countMultiset(target.versions))) {
    violations.push(
      `version-like numbers must be copied verbatim: source [${source.versions.join(', ')}], translation [${target.versions.join(', ')}]`,
    );
  }

  return { violations, ambiguous: [...source.ambiguous, ...target.ambiguous] };
}

/**
 * Full structural comparison between the source and translation models
 * produced by `extractTranslationModel`. Returns invariant booleans, a
 * human-readable violation list, and the ambiguous-number warnings.
 */
export function compareTranslationModels(sourceModel, targetModel, { targetLanguage }) {
  const violations = [];
  const invariants = {
    structureUnchanged: true,
    codeBlocksUnchanged: true,
    inlineCodeUnchanged: true,
    urlsUnchanged: true,
    componentsUnchanged: true,
    numbersUnchanged: true,
  };

  if (JSON.stringify(sourceModel.structure.blocks) !== JSON.stringify(targetModel.structure.blocks)) {
    invariants.structureUnchanged = false;
    violations.push('document structure differs: top-level block sequence must be identical');
  }

  if (
    sourceModel.protectedContent.codeBlockHashes.length !==
      targetModel.protectedContent.codeBlockHashes.length ||
    sourceModel.protectedContent.codeBlockHashes.some(
      (hash, index) => hash !== targetModel.protectedContent.codeBlockHashes[index],
    )
  ) {
    invariants.codeBlocksUnchanged = false;
    violations.push('code blocks must remain byte-identical (order and content)');
  }

  if (
    !multisetEqual(
      countMultiset(sourceModel.protectedContent.inlineCodeValues),
      countMultiset(targetModel.protectedContent.inlineCodeValues),
    )
  ) {
    invariants.inlineCodeUnchanged = false;
    violations.push('inline code values must remain unchanged');
  }

  if (
    !multisetEqual(
      countMultiset(sourceModel.protectedContent.urls),
      countMultiset(targetModel.protectedContent.urls),
    )
  ) {
    invariants.urlsUnchanged = false;
    violations.push('URLs (links, images, protected component attributes) must remain unchanged');
  }

  const sourceInstances = sourceModel.componentInstances;
  const targetInstances = targetModel.componentInstances;
  if (sourceInstances.length !== targetInstances.length) {
    invariants.componentsUnchanged = false;
    violations.push(
      `component instance count differs: ${sourceInstances.length} in source, ${targetInstances.length} in translation`,
    );
  } else {
    sourceInstances.forEach((sourceInstance, index) => {
      const targetInstance = targetInstances[index];
      if (sourceInstance.name !== targetInstance.name) {
        invariants.componentsUnchanged = false;
        violations.push(
          `component order differs at position ${index + 1}: <${sourceInstance.name}> vs <${targetInstance.name}>`,
        );
        return;
      }
      if (JSON.stringify(sourceInstance.protectedAttrs) !== JSON.stringify(targetInstance.protectedAttrs)) {
        invariants.componentsUnchanged = false;
        violations.push(
          `protected attributes of <${sourceInstance.name}> must remain unchanged (src, videoId, poster, url)`,
        );
      }
      // Components without a locale prop (Figure) keep null on both sides;
      // components with the derived locale attr must carry "en" in the
      // source and the target language in the translation.
      const localeValid =
        sourceInstance.locale === null && targetInstance.locale === null
          ? true
          : sourceInstance.locale === 'en' && targetInstance.locale === targetLanguage;
      if (!localeValid) {
        invariants.componentsUnchanged = false;
        violations.push(
          `locale attribute of <${sourceInstance.name}> must be "en" in the source and "${targetLanguage}" in the translation (found ${sourceInstance.locale} -> ${targetInstance.locale})`,
        );
      }
    });
  }

  const sourceUnitText = sourceModel.units.map((unit) => unit.text).join('\n');
  const targetUnitText = targetModel.units.map((unit) => unit.text).join('\n');
  const numbers = compareNumbers(sourceUnitText, targetUnitText, { targetLanguage });
  if (numbers.violations.length > 0) {
    invariants.numbersUnchanged = false;
    violations.push(...numbers.violations);
  }

  return { invariants, violations, ambiguousNumbers: numbers.ambiguous };
}
