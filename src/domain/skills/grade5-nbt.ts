import { Skill, Generator, Problem, ProblemType } from "../types";

/**
 * MODULE 1: Place Value and Decimal Operations
 * Standards: 5.NBT.A.1, 5.NBT.A.2, 5.NBT.A.3, 5.NBT.A.4
 */

// ----------------------------------------------------------------------
// 1. Powers of 10 (5.NBT.A.1, 5.NBT.A.2)
// ----------------------------------------------------------------------
// Recognizing that a digit in one place represents 10 times as much as it represents
// in the place to its right and 1/10 of what it represents in the place to its left.
// Using whole-number exponents to denote powers of 10.

const genPowersOf10: Generator = {
  generate: (): Problem => {
    // Determine the type of problem:
    // 1. Shift relation (e.g., 300 is 10 times as much as ?)
    // 2. Exponent evaluation (e.g., 10^3 = ?)
    // 3. Multiplication by power of 10 (e.g., 5.2 x 100 = ?)
    // 4. Division by power of 10 (e.g., 450 / 10 = ?)

    const type = Math.floor(Math.random() * 4);

    // Type 0: Shift relation
    if (type === 0) {
      const base = Math.floor(Math.random() * 9) + 1; // 1-9
      const power = Math.floor(Math.random() * 4) + 1; // 1-4
      const val1 = base * Math.pow(10, power);

      const isMultiplication = Math.random() < 0.5;

      if (isMultiplication) {
        // "val1 is 10 times as much as what?"
        const val2 = base * Math.pow(10, power - 1);
        return {
          type: 'fill_in_blank',
          stem: `${val1} is 10 times as much as ?`,
          items: [{
            id: 'ans',
            type: 'math',
            answer_spec: { input_type: 'integer', accepted_forms: [String(val2)] },
            solution_logic: { final_answer_canonical: String(val2) }
          }]
        };
      } else {
        // "val2 is 1/10 of what?"
        const val2 = base * Math.pow(10, power - 1);
        return {
          type: 'fill_in_blank',
          stem: `${val2} is 1/10 of ?`,
          items: [{
            id: 'ans',
            type: 'math',
            answer_spec: { input_type: 'integer', accepted_forms: [String(val1)] },
            solution_logic: { final_answer_canonical: String(val1) }
          }]
        };
      }
    }

    // Type 1: Exponent evaluation
    else if (type === 1) {
      const exponent = Math.floor(Math.random() * 4) + 1; // 1-4
      // Sometimes just 10^e, sometimes 10 x 10 x ...
      const showExpanded = Math.random() < 0.5;

      if (showExpanded) {
        const factors = Array(exponent).fill(10).join(' × ');
        const answer = Math.pow(10, exponent);
        return {
          type: 'fill_in_blank',
          stem: `${factors} = 10^?`,
          items: [{
            id: 'ans',
            type: 'math',
            answer_spec: { input_type: 'integer', accepted_forms: [String(exponent)] },
            solution_logic: { final_answer_canonical: String(exponent) }
          }]
        };
      } else {
        const answer = Math.pow(10, exponent);
        return {
          type: 'fill_in_blank',
          stem: `10^${exponent} = ?`,
          items: [{
            id: 'ans',
            type: 'math',
            answer_spec: { input_type: 'integer', accepted_forms: [String(answer)] },
            solution_logic: { final_answer_canonical: String(answer) }
          }]
        };
      }
    }

    // Type 2: Multiplication by power of 10
    else if (type === 2) {
      const isDecimal = Math.random() < 0.7;
      let num: number;
      if (isDecimal) {
        num = parseFloat((Math.random() * 10).toFixed(3)); // e.g. 3.456
      } else {
        num = Math.floor(Math.random() * 100) + 1;
      }

      const exponent = Math.floor(Math.random() * 3) + 1; // 1-3
      const multiplier = Math.pow(10, exponent);

      // We want to format the question sometimes as x 100, sometimes x 10^2
      const useExponent = Math.random() < 0.5;
      const questionPart = useExponent ? `10^${exponent}` : String(multiplier);

      // Calculate precise answer to avoid floating point weirdness
      // String manipulation is safer for shifts
      const answer = (num * multiplier);
      // Fix potential floating point errors like 3.4 * 10 = 34.00000004
      // Max decimals was 3, multiplying by max 1000 shifts it to integer or less decimals.
      const canonical = parseFloat(answer.toFixed(4)).toString();

      return {
        type: 'fill_in_blank',
        stem: `${num} × ${questionPart} = ?`,
        items: [{
          id: 'ans',
          type: 'math',
          answer_spec: { input_type: 'decimal', accepted_forms: [canonical] },
          solution_logic: { final_answer_canonical: canonical }
        }]
      };
    }

    // Type 3: Division by power of 10
    else {
      // Start with a number that results in a clean decimal
      const targetDecimalPlaces = Math.floor(Math.random() * 3); // 0, 1, 2
      const exponent = Math.floor(Math.random() * 3) + 1; // 1, 2, 3

      // Working backwards: result * 10^exp = dividend
      // result should be something like 4.5
      // dividend would be 450

      const baseNum = Math.floor(Math.random() * 1000);
      const dividend = baseNum;
      const divisor = Math.pow(10, exponent);

      const useExponent = Math.random() < 0.5;
      const questionPart = useExponent ? `10^${exponent}` : String(divisor);

      const answer = dividend / divisor;
      const canonical = parseFloat(answer.toFixed(5)).toString();

      return {
        type: 'fill_in_blank',
        stem: `${dividend} ÷ ${questionPart} = ?`,
        items: [{
          id: 'ans',
          type: 'math',
          answer_spec: { input_type: 'decimal', accepted_forms: [canonical] },
          solution_logic: { final_answer_canonical: canonical }
        }]
      };
    }
  }
};

export const SKILL_5_NBT_POWERS_10: Skill = {
  id: '5.nbt.powers_10',
  name: 'Powers of 10 and Place Value',
  description: 'Understand powers of 10 and patterns in multiplication/division',
  generator: genPowersOf10,
  misconceptions: {
    'count_zeros': 'When multiplying by 10^n, you move the decimal point n places to the right. Do not just add zeros if there is a decimal.',
    'direction_error': 'Multiplication moves the decimal to the right (making the number bigger), division moves it to the left (making it smaller).'
  }
};


// ----------------------------------------------------------------------
// 2. Decimal Forms (5.NBT.A.3.a)
// ----------------------------------------------------------------------
// Read and write decimals to thousandths using base-ten numerals, number names, and expanded form.

const genDecimalForms: Generator = {
  generate: (): Problem => {
    // Generate a decimal up to thousandths
    const whole = Math.floor(Math.random() * 100);
    const decimalPart = Math.floor(Math.random() * 999) + 1;
    // Format to 3 decimal places string e.g., "005"
    const decimalStr = String(decimalPart).padStart(3, '0');
    // Remove trailing zeros for the canonical number
    const numStr = `${whole}.${decimalStr}`.replace(/\.?0+$/, '');
    const numVal = parseFloat(numStr);

    const type = Math.random() < 0.5 ? 'expanded_to_standard' : 'standard_to_expanded_part';

    if (type === 'expanded_to_standard') {
      // e.g. 3 x 10 + 4 x 1 + 5 x (1/10) + ...
      const parts: string[] = [];

      // Whole part decomposition
      const wholeStr = String(whole);
      for (let i = 0; i < wholeStr.length; i++) {
        const digit = parseInt(wholeStr[i]);
        if (digit === 0) continue;
        const placeVal = Math.pow(10, wholeStr.length - 1 - i);
        parts.push(`${digit} × ${placeVal}`);
      }

      // Decimal part decomposition
      // Using fractions 1/10, 1/100, 1/1000
      // We can also use decimals 0.1, 0.01 but standard often uses fractions for expanded form in 5th grade
      const decStrActual = numStr.split('.')[1] || "";
      for (let i = 0; i < decStrActual.length; i++) {
        const digit = parseInt(decStrActual[i]);
        if (digit === 0) continue;
        const denom = Math.pow(10, i + 1);
        parts.push(`${digit} × (1/${denom})`);
      }

      const expandedForm = parts.join(' + ');

      return {
        type: 'fill_in_blank',
        stem: `Write the standard form number for: ${expandedForm}`,
        items: [{
          id: 'ans',
          type: 'math',
          answer_spec: { input_type: 'decimal', accepted_forms: [numStr] },
          solution_logic: { final_answer_canonical: numStr }
        }]
      };
    } else {
        // Find a missing part of expanded form
        // e.g. 45.67 = 4 x 10 + ? x 1 + ...
        // Let's keep it simple and ask for the value of a specific digit
        // "What is the value of the digit 7 in 45.67?"
        // Or expanded form fill in blank

        // Let's do: 45.602 = 4 x 10 + 5 x 1 + 6 x (1/10) + 2 x (?)

        // Pick a non-zero digit to hide
        // Ensure we have at least one decimal digit
        const s = numStr; // e.g. "45.602"
        const dotIndex = s.indexOf('.');
        if (dotIndex === -1) {
           // fallback if somehow integer (should be rare due to random generation logic)
           return {
             type: 'fill_in_blank',
             stem: `Write ${s} in expanded form`,
             items: [{ id: 'ans', type: 'math', answer_spec: {input_type:'text'}, solution_logic: {final_answer_canonical: s} }] // Placeholder
           };
        }

        // Find digits suitable for hiding (non-zero)
        const candidates: {digit: string, placeValStr: string, placeValNum: number}[] = [];

        const [w, d] = s.split('.');

        for(let i=0; i<w.length; i++) {
            if(w[i] !== '0') {
                const pv = Math.pow(10, w.length - 1 - i);
                candidates.push({digit: w[i], placeValStr: String(pv), placeValNum: pv});
            }
        }
        for(let i=0; i<d.length; i++) {
            if(d[i] !== '0') {
                const pv = Math.pow(10, i + 1);
                candidates.push({digit: d[i], placeValStr: `1/${pv}`, placeValNum: 1/pv});
            }
        }

        if (candidates.length === 0) return genDecimalForms.generate(); // retry

        const hiddenIndex = Math.floor(Math.random() * candidates.length);
        const hidden = candidates[hiddenIndex];

        // Construct the string with a ?
        const parts: string[] = [];
        for (let i = 0; i < w.length; i++) {
            const digit = w[i];
            if (digit === '0') continue;
            const pv = Math.pow(10, w.length - 1 - i);
            const partStr = `${digit} × ${pv}`;
            if (digit === hidden.digit && pv === hidden.placeValNum && hidden.placeValStr.indexOf('/') === -1) {
                 parts.push(`?`);
            } else if (digit === hidden.digit && pv === hidden.placeValNum) {
                 // Should ideally not happen if we differentiate well, but let's just match objects
                 // Re-doing the loop is messy. Let's just build the parts list first then replace.
            }
        }
        // Actually, let's just rebuild carefully.

        const allParts: string[] = [];
        candidates.forEach((c, idx) => {
            if (idx === hiddenIndex) {
                 allParts.push(`${c.digit} × ?`);
            } else {
                 allParts.push(`${c.digit} × ${c.placeValStr.includes('/') ? `(${c.placeValStr})` : c.placeValStr}`);
            }
        });

        const problemStr = `${numStr} = ${allParts.join(' + ')}`;

        // The answer is the place value (e.g., 100 or 1/10)
        // If it's a fraction, we accept "1/10" or "0.1"
        const accepted = [hidden.placeValStr];
        if (hidden.placeValStr.includes('/')) {
            accepted.push(String(hidden.placeValNum)); // decimal form
        }

        return {
            type: 'fill_in_blank',
            stem: `Fill in the missing value: ${problemStr}`,
            items: [{
                id: 'ans',
                type: 'math',
                answer_spec: { input_type: 'text', accepted_forms: accepted },
                solution_logic: { final_answer_canonical: hidden.placeValStr }
            }]
        };
    }
  }
};

export const SKILL_5_NBT_DECIMAL_FORMS: Skill = {
  id: '5.nbt.decimal_forms',
  name: 'Decimal Forms',
  description: 'Read and write decimals in standard and expanded forms',
  generator: genDecimalForms,
  misconceptions: {
    'place_value': 'Remember that the first place to the right of the decimal is tenths (1/10), then hundredths (1/100).',
    'decimal_point': 'The decimal point separates the whole number part from the fractional part.'
  }
};


// ----------------------------------------------------------------------
// 3. Comparing Decimals (5.NBT.A.3.b)
// ----------------------------------------------------------------------
// Comparing two decimals to thousandths based on meanings of the digits in each place, using >, =, and < symbols.

const genCompareDecimals: Generator = {
  generate: (): Problem => {
    // Generate two decimals that are tricky to compare
    // e.g. 0.4 and 0.45 (longer is larger?)
    // e.g. 0.3 and 0.30 (same)
    // e.g. 0.3 and 0.03 (tenths vs hundredths)

    const type = Math.random();
    let n1: number, n2: number;
    let s1: string, s2: string;

    if (type < 0.3) {
      // Different lengths, "longer is larger" misconception
      // e.g. 0.5 vs 0.456
      const base = Math.floor(Math.random() * 9) + 1; // 1-9
      n1 = base / 10; // 0.x

      // make n2 smaller but longer: e.g., if n1=0.5, n2=0.499
      n2 = (base * 100 - (Math.floor(Math.random()*10)+1)) / 1000;

      // Or make n2 larger but shorter? (less common)
      // Let's randomize which is which
      if (Math.random() < 0.5) {
        // Swap to make n1 the longer one sometimes
        [n1, n2] = [n2, n1];
      }
    } else if (type < 0.6) {
      // Equivalence with zeros
      // 0.4 vs 0.40
      const base = Math.floor(Math.random() * 99) + 1;
      n1 = base / 100;
      s1 = n1.toString();
      s2 = s1 + "0";
      n2 = n1;
    } else {
      // Close numbers
      // 3.456 vs 3.457
      const base = Math.floor(Math.random() * 1000);
      n1 = base / 1000;
      n2 = (base + (Math.random() < 0.5 ? 1 : -1)) / 1000;
      // boundary check
      if (n2 < 0) n2 = 0.001;
    }

    // Ensure strings
    s1 = s1 || n1.toString();
    s2 = s2 || n2.toString();

    let expected = '=';
    if (n1 > n2) expected = '>';
    if (n1 < n2) expected = '<';

    return {
      type: 'multiple_choice',
      stem: `Compare the two decimals: ${s1} ? ${s2}`,
      options: ['>', '<', '='],
      items: [{
        id: 'ans',
        type: 'text', // using text for symbol selection
        answer_spec: { input_type: 'text', accepted_forms: [expected] },
        solution_logic: { final_answer_canonical: expected }
      }]
    };
  }
};

export const SKILL_5_NBT_COMPARE_DECIMALS: Skill = {
  id: '5.nbt.compare_decimals',
  name: 'Comparing Decimals',
  description: 'Compare two decimals to thousandths',
  generator: genCompareDecimals,
  misconceptions: {
    'longer_is_larger': 'A number with more digits is not necessarily larger. Compare place by place starting from the left.',
    'shorter_is_larger': 'Tenths are larger than hundredths. 0.3 > 0.03 even though 3 is the same digit.'
  }
};


// ----------------------------------------------------------------------
// 4. Rounding Decimals (5.NBT.A.4)
// ----------------------------------------------------------------------
// Use place value understanding to round decimals to any place.

const genRoundingDecimals: Generator = {
  generate: (): Problem => {
    // Round to whole, tenth, or hundredth
    const places = ['whole number', 'tenth', 'hundredth'];
    const placeIdx = Math.floor(Math.random() * 3);
    const targetPlace = places[placeIdx];

    // Generate a number with 3 decimal places
    const whole = Math.floor(Math.random() * 100);
    const dec = Math.floor(Math.random() * 900) + 100; // 100-999 to ensure 3 digits
    const num = parseFloat(`${whole}.${dec}`);

    let rounded: number;
    let placeValueStr = "";

    if (placeIdx === 0) {
      // Whole number
      rounded = Math.round(num);
      placeValueStr = "ones place";
    } else if (placeIdx === 1) {
      // Tenth
      // 3.456 -> 3.5
      rounded = Math.round(num * 10) / 10;
      placeValueStr = "tenths place";
    } else {
      // Hundredth
      // 3.456 -> 3.46
      rounded = Math.round(num * 100) / 100;
      placeValueStr = "hundredths place";
    }

    return {
      type: 'fill_in_blank',
      stem: `Round ${num} to the nearest ${targetPlace}.`,
      items: [{
        id: 'ans',
        type: 'math',
        answer_spec: { input_type: 'decimal', accepted_forms: [String(rounded)] },
        solution_logic: { final_answer_canonical: String(rounded) }
      }]
    };
  }
};

export const SKILL_5_NBT_ROUND_DECIMALS: Skill = {
  id: '5.nbt.round_decimals',
  name: 'Rounding Decimals',
  description: 'Round decimals to any place',
  generator: genRoundingDecimals,
  misconceptions: {
    'truncation': 'Rounding is not just cutting off the numbers. If the next digit is 5 or more, you must round up.',
    'place_confusion': 'Identify the correct place value first before looking at the neighbor digit.'
  }
};
