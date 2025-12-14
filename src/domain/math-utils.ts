export function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

export function getFactors(n: number): number[] {
    const factors = [];
    for (let i = 1; i <= n; i++) {
        if (n % i === 0) factors.push(i);
    }
    return factors;
}
