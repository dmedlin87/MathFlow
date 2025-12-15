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

    // Helper for robust rounding to avoid floating point issues (1.235 -> 1.24)
    const robustRound = (n: number, scale: number) => {
        return Math.round((n + Number.EPSILON) * scale) / scale;
    };

    if (placeIdx === 0) {
      // Whole number
      rounded = robustRound(num, 1);
      placeValueStr = "ones place";
    } else if (placeIdx === 1) {
      // Tenth
      // 3.456 -> 3.5
      rounded = robustRound(num, 10);
      placeValueStr = "tenths place";
    } else {
      // Hundredth
      // 3.456 -> 3.46
      rounded = robustRound(num, 100);
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

/**
 * MODULE 2 & 3 Additions: Operations with Decimals and Multi-Digit
 * Standards: 5.NBT.B.5, 5.NBT.B.6, 5.NBT.B.7
 */

// ----------------------------------------------------------------------
// 5. Add/Subtract Decimals (5.NBT.B.7 - partial)
// ----------------------------------------------------------------------

const genAddSubDecimals: Generator = {
  generate: (): Problem => {
    const isAddition = Math.random() < 0.5;

    // Generate decimals with varying lengths to force alignment issues
    // e.g. 3.5 + 4.25
    const d1 = Math.floor(Math.random() * 2) + 1; // 1 or 2 decimal places
    const d2 = Math.floor(Math.random() * 2) + 1; // 1 or 2 decimal places

    // Ensure at least one has 2 places for richness, or mismatch
    // If d1=1 and d2=1, maybe make one 3? Standard says "to hundredths", so max 2 usually, but thousandths is also 5th grade (5.NBT.A.1)

    const n1 = parseFloat((Math.random() * 50 + 1).toFixed(d1));
    const n2 = parseFloat((Math.random() * 50 + 1).toFixed(d2));

    let result = isAddition ? n1 + n2 : n1 - n2;
    // Formatting: 2 decimal places max for result usually
    // JavaScript float precision fix
    result = parseFloat(result.toFixed(3));

    // For subtraction, ensure n1 > n2 or handle negative? Grade 5 usually positive only?
    // Grade 6 is negative numbers. We should swap if negative.
    let finalN1 = n1;
    let finalN2 = n2;
    if (!isAddition && n1 < n2) {
      finalN1 = n2;
      finalN2 = n1;
      result = parseFloat((finalN1 - finalN2).toFixed(3));
    }

    const op = isAddition ? '+' : '-';

    return {
      type: 'fill_in_blank',
      stem: `Compute: ${finalN1} ${op} ${finalN2} = ?`,
      items: [{
        id: 'ans',
        type: 'math',
        answer_spec: { input_type: 'decimal', accepted_forms: [String(result)] },
        solution_logic: { final_answer_canonical: String(result) }
      }]
    };
  }
};

export const SKILL_5_NBT_ADD_SUB_DECIMALS: Skill = {
  id: '5.nbt.add_sub_decimals',
  name: 'Add and Subtract Decimals',
  description: 'Add and subtract decimals to hundredths',
  generator: genAddSubDecimals,
  misconceptions: {
    'alignment': 'You must line up the decimal points before adding or subtracting.',
    'place_drift': 'Do not add tenths to hundredths. Use zeros as placeholders to help line up the numbers.'
  }
};

// ----------------------------------------------------------------------
// 6. Multi-Digit Multiplication (5.NBT.B.5)
// ----------------------------------------------------------------------
// Fluently multiply multi-digit whole numbers using the standard algorithm.

const genMultWhole: Generator = {
  generate: (): Problem => {
    // 3-digit x 2-digit, 4-digit x 2-digit, etc.
    // Grade 5 expectation: Standard Algorithm

    const type = Math.random();
    let n1: number, n2: number;

    if (type < 0.5) {
      // 3 x 2
      n1 = Math.floor(Math.random() * 900) + 100; // 100-999
      n2 = Math.floor(Math.random() * 90) + 10;   // 10-99
    } else {
      // 4 x 2 (or 3 x 3? Standard usually says "multi-digit", but 4x2 is common max)
      n1 = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
      n2 = Math.floor(Math.random() * 90) + 10;     // 10-99
    }

    const result = n1 * n2;

    return {
      type: 'fill_in_blank',
      stem: `Multiply: ${n1} × ${n2} = ?`,
      items: [{
        id: 'ans',
        type: 'math',
        answer_spec: { input_type: 'integer', accepted_forms: [String(result)] },
        solution_logic: { final_answer_canonical: String(result) }
      }]
    };
  }
};

export const SKILL_5_NBT_MULT_WHOLE: Skill = {
  id: '5.nbt.mult_whole',
  name: 'Multi-Digit Multiplication',
  description: 'Multiply multi-digit whole numbers',
  generator: genMultWhole,
  misconceptions: {
    'zero_placeholder': 'When moving to the next line (tens place), don\'t forget to put a zero placeholder.',
    'column_alignment': 'Keep your columns straight to add the partial products correctly.'
  }
};

// ----------------------------------------------------------------------
// 7. Decimal Multiplication (5.NBT.B.7 - partial)
// ----------------------------------------------------------------------

const genMultDecimals: Generator = {
  generate: (): Problem => {
    // Decimal x Whole or Decimal x Decimal
    const isDecDec = Math.random() < 0.6;

    let n1: number, n2: number;
    let n1Str: string, n2Str: string;

    if (isDecDec) {
      // e.g. 3.4 x 0.5
      n1 = parseFloat((Math.random() * 10).toFixed(1));
      n2 = parseFloat((Math.random() * 5).toFixed(1));
    } else {
      // e.g. 4.52 x 4
      const d = Math.random() < 0.5 ? 1 : 2;
      n1 = parseFloat((Math.random() * 20).toFixed(d));
      n2 = Math.floor(Math.random() * 9) + 2; // 2-10
    }

    const result = n1 * n2;
    // Fix float precision
    const canonical = parseFloat(result.toFixed(4)).toString();

    return {
      type: 'fill_in_blank',
      stem: `Multiply: ${n1} × ${n2} = ?`,
      items: [{
        id: 'ans',
        type: 'math',
        answer_spec: { input_type: 'decimal', accepted_forms: [canonical] },
        solution_logic: { final_answer_canonical: canonical }
      }]
    };
  }
};

export const SKILL_5_NBT_MULT_DECIMALS: Skill = {
  id: '5.nbt.mult_decimals',
  name: 'Decimal Multiplication',
  description: 'Multiply decimals to hundredths',
  generator: genMultDecimals,
  misconceptions: {
    'decimal_placement': 'Ignore the decimal points while multiplying, then place the decimal in the answer. The number of decimal places in the answer is the sum of decimal places in the factors.',
    'line_up_error': 'You do not need to line up the decimal points for multiplication.'
  }
};

// ----------------------------------------------------------------------
// 8. Multi-Digit Division (5.NBT.B.6)
// ----------------------------------------------------------------------
// Find whole-number quotients of whole numbers with up to four-digit dividends and two-digit divisors.

const genDivWhole: Generator = {
  generate: (): Problem => {
    // 3-digit / 1-digit, 4-digit / 1-digit, 3-digit / 2-digit, 4-digit / 2-digit
    // We should bias towards 2-digit divisors as that's the new 5th grade skill

    const divisorDigits = Math.random() < 0.7 ? 2 : 1;
    let divisor: number;
    if (divisorDigits === 1) {
        divisor = Math.floor(Math.random() * 8) + 2; // 2-9
    } else {
        divisor = Math.floor(Math.random() * 90) + 10; // 10-99
    }

    // Construct dividend to be a multiple of divisor for clean division?
    // 5.NBT.B.6 says "Find whole-number quotients...". It doesn't explicitly say "without remainder", but "using strategies...".
    // Usually starts with no remainders, then remainders.
    // Let's do 50/50 clean vs remainder
    const isClean = Math.random() < 0.6;

    const quotient = Math.floor(Math.random() * 100) + 10; // 2 or 3 digit quotient
    let dividend = quotient * divisor;
    let remainder = 0;

    if (!isClean) {
        remainder = Math.floor(Math.random() * (divisor - 1)) + 1;
        dividend += remainder;
    }

    // We need to decide how to ask for the answer. "Quotient and Remainder"? or just "Evaluate"?
    // If we use 'integer' input, it expects a single number.
    // If remainder exists, maybe ask "What is the quotient?" and "What is the remainder?" separately?
    // Or "54 / 4 = ? R ?"

    if (remainder === 0) {
        return {
            type: 'fill_in_blank',
            stem: `Divide: ${dividend} ÷ ${divisor} = ?`,
            items: [{
                id: 'ans',
                type: 'math',
                answer_spec: { input_type: 'integer', accepted_forms: [String(quotient)] },
                solution_logic: { final_answer_canonical: String(quotient) }
            }]
        };
    } else {
        return {
            type: 'fill_in_blank',
            stem: `Divide: ${dividend} ÷ ${divisor} = ? R ?`,
            items: [
                {
                    id: 'quotient',
                    type: 'math',
                    answer_spec: { input_type: 'integer', accepted_forms: [String(quotient)] },
                    solution_logic: { final_answer_canonical: String(quotient) }
                },
                {
                    id: 'remainder',
                    type: 'math',
                    answer_spec: { input_type: 'integer', accepted_forms: [String(remainder)] },
                    solution_logic: { final_answer_canonical: String(remainder) }
                }
            ]
        };
    }
  }
};

export const SKILL_5_NBT_DIV_WHOLE: Skill = {
  id: '5.nbt.div_whole',
  name: 'Multi-Digit Division',
  description: 'Divide multi-digit numbers (up to 4-digit dividend, 2-digit divisor)',
  generator: genDivWhole,
  misconceptions: {
    'estimation': 'Use estimation to help find the quotient digit. e.g., think "How many 20s in 80?"',
    'remainder_size': 'The remainder must always be smaller than the divisor.'
  }
};

// ----------------------------------------------------------------------
// 9. Decimal Division (5.NBT.B.7 - partial)
// ----------------------------------------------------------------------

const genDivDecimals: Generator = {
  generate: (): Problem => {
    // Decimal / Whole, Whole / Decimal, Decimal / Decimal
    // Usually constructed to have clean terminating decimal answers

    const type = Math.floor(Math.random() * 3);
    let dividend: number, divisor: number;

    // Helper to get clean division
    // quotient * divisor = dividend
    // choose quotient and divisor, compute dividend

    const quotient = parseFloat((Math.random() * 20 + 0.1).toFixed(2));

    if (type === 0) {
       // Decimal / Whole
       // dividend is decimal, divisor is whole
       divisor = Math.floor(Math.random() * 10) + 2;
    } else if (type === 1) {
       // Whole / Decimal
       // dividend is whole, divisor is decimal
       // Harder to generate randomly without getting complex dividends
       // Let's stick to simple ones.
       divisor = parseFloat((Math.random() * 5 + 0.1).toFixed(1));
    } else {
       // Decimal / Decimal
       divisor = parseFloat((Math.random() * 5 + 0.1).toFixed(1));
    }

    dividend = parseFloat((quotient * divisor).toFixed(4));

    return {
        type: 'fill_in_blank',
        stem: `Divide: ${dividend} ÷ ${divisor} = ?`,
        items: [{
            id: 'ans',
            type: 'math',
            answer_spec: { input_type: 'decimal', accepted_forms: [String(quotient)] },
            solution_logic: { final_answer_canonical: String(quotient) }
        }]
    };
  }
};

export const SKILL_5_NBT_DIV_DECIMALS: Skill = {
  id: '5.nbt.div_decimals',
  name: 'Decimal Division',
  description: 'Divide decimals to hundredths',
  generator: genDivDecimals,
  misconceptions: {
    'move_decimal': 'If the divisor is a decimal, move the decimal point to the right to make it a whole number. Then move the dividend\'s decimal point the same amount.',
    'position': 'Place the decimal point in the quotient directly above the decimal point in the dividend (after adjustment).'
  }
};
