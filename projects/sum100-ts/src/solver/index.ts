import {ASTNode, BinaryOpNode, ConcatNode, ExpressionNode, NumberNode, UnaryOpNode} from "../ast";

// 求解结果
export interface SolutionResult {
    expression: ExpressionNode;
    attempts: number;
    duration: number;
    found: boolean;
}

// 求解进度报告
export interface SolverReport {
    type: 'progress' | 'solution' | 'complete';
    attempts: number;
    currentExpression?: ExpressionNode;
    eta: number; // 预计剩余时间（毫秒）
    progress: number; // 0-1之间的进度
    duration: number; // 已用时间（毫秒）
}

// 求解器配置
export interface SolverConfig {
    maxAttempts?: number;
    // 毫秒
    timeout?: number;
    maxFactorialDepth?: number;
    enableConcatenation?: boolean;
    enableAddition?: boolean;
    enableSubtraction?: boolean;
    enableMultiplication?: boolean;
    enableDivision?: boolean;
    enablePower?: boolean;
    enableFactorial?: boolean;
    enableSquareRoot?: boolean;
    enableNegation?: boolean;
    enableModulo?: boolean;
    // 报告间隔（毫秒）
    reportInterval?: number;
    // Max expression depth
    maxDepth?: number;
}

// 记忆化缓存 (保持不变)
class AttemptCache {
    private cache = new Map<string, number>();

    get(key: string): number | undefined {
        return this.cache.get(key);
    }

    set(key: string, value: number): void {
        if (this.cache.size > 100000) {
            this.cache.clear();
        } // Increased cache size
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }
}

export class Solver {
    private cache = new AttemptCache();
    private startTime = 0;
    private attempts = 0;
    private solutions: ExpressionNode[] = [];
    private config: Required<SolverConfig>;
    private cancelled = false;
    private lastReportTime = 0;

    constructor(config: SolverConfig = {}) {
        this.config = {
            maxAttempts: config.maxAttempts ?? 1000000,
            timeout: config.timeout ?? 30000,
            maxFactorialDepth: config.maxFactorialDepth ?? 2, // Reduced default, deep factorials are slow
            enableConcatenation: config.enableConcatenation ?? true,
            enableAddition: config.enableAddition ?? true,
            enableSubtraction: config.enableSubtraction ?? true,
            enableMultiplication: config.enableMultiplication ?? true,
            enableDivision: config.enableDivision ?? true,
            enablePower: config.enablePower ?? true,
            enableFactorial: config.enableFactorial ?? true,
            enableSquareRoot: config.enableSquareRoot ?? true,
            enableNegation: config.enableNegation ?? true,
            enableModulo: config.enableModulo ?? true,
            reportInterval: config.reportInterval ?? 100,
            // Default max expression depth
            maxDepth: config.maxDepth ?? 8,
        };
    }

    cancel(): void {
        this.cancelled = true;
    }

    * solve(numbers: number[], target: number): Generator<SolverReport, SolutionResult, unknown> {
        this.reset();
        this.startTime = Date.now();

        if (numbers.length === 0) {
            const duration = Date.now() - this.startTime;
            yield {type: 'complete', attempts: 0, eta: 0, progress: 1, duration};
            return {
                expression: new ExpressionNode(new NumberNode(0), target),
                attempts: 0, duration, found: false
            };
        }

        try {
            // Initial AST creation considering order and concatenation ---
            const initialAstCreationPaths: Array<{ ast: ASTNode, numbersConsumed: number }> = [];

            // Path 1: First number itself
            initialAstCreationPaths.push({ast: new NumberNode(numbers[0]), numbersConsumed: 1});

            // Path 2: Concatenation from the beginning (if enabled)
            if (this.config.enableConcatenation) {
                // Concatenate 2 to 4 numbers (or up to numbers.length)
                for (let len = 2; len <= Math.min(4, numbers.length); len++) {
                    const initialNumsToConcat = numbers.slice(0, len);
                    initialAstCreationPaths.push({ast: new ConcatNode(initialNumsToConcat), numbersConsumed: len});
                }
            }

            for (const path of initialAstCreationPaths) {
                // Early exit if enough solutions are found or other limits reached
                if (this.cancelled || (this.solutions.length >= 10 && this.config.maxAttempts > this.attempts) || (Date.now() - this.startTime >= this.config.timeout)) {
                    break;
                }
                const {ast: initialAst, numbersConsumed} = path;
                const remainingInitialNumbers = numbers.slice(numbersConsumed);
                yield* this.findCombinationsRecursive(initialAst, remainingInitialNumbers, target, 0);
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'CANCELLED') {
                // Operation was cancelled
            } else {
                console.error("Solver error:", error); // Log other errors
                throw error; // Rethrow if not a cancellation
            }
        }

        const duration = Date.now() - this.startTime;
        yield {
            type: 'complete',
            attempts: this.attempts,
            eta: 0,
            progress: 1,
            duration
        };

        return {
            expression: this.solutions[0] || new ExpressionNode(new NumberNode(NaN), target), // Default if no solution
            attempts: this.attempts,
            duration,
            found: this.solutions.length > 0
        };
    }

    private reset(): void {
        this.cache.clear();
        this.attempts = 0;
        this.solutions = [];
        this.cancelled = false;
        this.lastReportTime = 0;
    }

    // --- NEW RECURSIVE FUNCTION ---
    private* findCombinationsRecursive(
        currentAst: ASTNode,
        remainingNumbers: number[],
        target: number,
        depth: number
    ): Generator<SolverReport, void, unknown> {
        if (this.cancelled) throw new Error('CANCELLED');
        if (Date.now() - this.startTime >= this.config.timeout) return;
        if (depth >= this.config.maxDepth) return;

        this.attempts++; // Count each state visited as an attempt

        if (this.attempts >= this.config.maxAttempts && this.config.maxAttempts > 0) return;


        if (Date.now() - this.lastReportTime >= this.config.reportInterval) {
            yield this.createProgressReport();
            this.lastReportTime = Date.now();
        }

        // Base Case: All numbers have been used
        if (remainingNumbers.length === 0) {
            if (this.checkSolution(currentAst, target)) {
                const solution = new ExpressionNode(currentAst, target);
                // Avoid adding string-wise duplicate solutions
                if (!this.solutions.some(s => s.toString() === solution.toString())) {
                    this.solutions.push(solution);
                    yield {
                        type: 'solution',
                        attempts: this.attempts,
                        currentExpression: solution,
                        eta: this.calculateETA(0),
                        progress: this.calculateProgress(0),
                        duration: Date.now() - this.startTime
                    };
                }
            }
            return;
        }

        // Option 1: Apply unary operator to currentAst, then continue with the SAME remainingNumbers
        const unaryOperators: Array<{ op: '!' | '√' | '-', enabled: boolean }> = [
            {op: '!', enabled: this.config.enableFactorial},
            {op: '√', enabled: this.config.enableSquareRoot},
            {op: '-', enabled: this.config.enableNegation}
        ];

        for (const {op: unaryOp, enabled} of unaryOperators) {
            if (!enabled) continue;
            if (this.solutions.length >= 10 && this.config.maxAttempts > 0 && this.config.maxAttempts <= this.attempts) return;

            try {
                const currentValue = this.evaluateWithCache(currentAst);
                if (unaryOp === '!' && (this.getFactorialDepth(currentAst) >= this.config.maxFactorialDepth || currentValue < 0 || !Number.isInteger(currentValue) || currentValue > 15)) continue;
                if (unaryOp === '!' && (Math.abs(currentValue - 2) < 1e-10 || Math.abs(currentValue - 1) < 1e-10)) continue;
                if (unaryOp === '√' && currentValue < 0) continue;
                if (unaryOp === '√' && Math.abs(currentValue - 1) < 1e-10) continue;
                if (unaryOp === '-' && currentAst instanceof UnaryOpNode && currentAst.operator === '-') continue;

                const astWithUnaryOp = new UnaryOpNode(unaryOp, currentAst);
                yield* this.findCombinationsRecursive(astWithUnaryOp, remainingNumbers, target, depth + 1);
            } catch (e) {
                /* Evaluation error during applicability check, skip */
            }
        }

        // Option 2: Form a right-hand side (RHS) from remainingNumbers, combine with currentAst using a binary operator
        if (remainingNumbers.length === 0) return; // Should be caught by base case, defensive

        const possibleRhsInfos: Array<{ node: ASTNode, numbersConsumedCount: number }> = [];

        // B1: RHS is the next single number
        possibleRhsInfos.push({node: new NumberNode(remainingNumbers[0]), numbersConsumedCount: 1});
//
        // B2: RHS is a concatenation of the next few numbers (if enabled and more than 1 number can be concatenated)
        if (this.config.enableConcatenation && remainingNumbers.length >= 2) {
            for (let len = 2; len <= Math.min(4, remainingNumbers.length); len++) { // Concatenate 2 to 4 numbers
                const numsToConcat = remainingNumbers.slice(0, len);
                possibleRhsInfos.push({node: new ConcatNode(numsToConcat), numbersConsumedCount: len});
            }
        }

        for (const rhsInfo of possibleRhsInfos) {
            if (this.solutions.length >= 10 && this.config.maxAttempts > 0 && this.config.maxAttempts <= this.attempts) return;

            const {node: baseRhsNode, numbersConsumedCount} = rhsInfo;
            const nextRemainingNumbersAfterRhs = remainingNumbers.slice(numbersConsumedCount);

            const finalRhsNodes: ASTNode[] = [baseRhsNode]; // Start with the base RHS node

            // Try applying unary operators to the baseRhsNode
            for (const {op: unaryOp, enabled} of unaryOperators) {
                if (!enabled) continue;
                try {
                    const rhsValue = this.evaluateWithCache(baseRhsNode);
                    if (unaryOp === '!' && (this.getFactorialDepth(baseRhsNode) >= this.config.maxFactorialDepth || rhsValue < 0 || !Number.isInteger(rhsValue) || rhsValue > 15)) continue;
                    if (unaryOp === '!' && (Math.abs(rhsValue - 2) < 1e-10 || Math.abs(rhsValue - 1) < 1e-10)) continue;
                    if (unaryOp === '√' && rhsValue < 0) continue;
                    if (unaryOp === '√' && Math.abs(rhsValue - 1) < 1e-10) continue;
                    if (unaryOp === '-' && baseRhsNode instanceof UnaryOpNode && baseRhsNode.operator === '-') continue;

                    finalRhsNodes.push(new UnaryOpNode(unaryOp, baseRhsNode));
                } catch (e) { /* Evaluation error during applicability check, skip */
                }
            }

            for (const finalRhsNode of finalRhsNodes) {
                if (this.solutions.length >= 10 && this.config.maxAttempts > 0 && this.config.maxAttempts <= this.attempts) return;

                const binaryOperators: Array<{ op: '+' | '-' | '*' | '/' | '%' | '^', enabled: boolean }> = [
                    {op: '+', enabled: this.config.enableAddition},
                    {op: '-', enabled: this.config.enableSubtraction},
                    {op: '*', enabled: this.config.enableMultiplication},
                    {op: '/', enabled: this.config.enableDivision},
                    {op: '%', enabled: this.config.enableModulo},
                    {op: '^', enabled: this.config.enablePower}
                ];

                for (const {op: binaryOp, enabled: binOpEnabled} of binaryOperators) {
                    if (!binOpEnabled) continue;
                    if (this.solutions.length >= 10 && this.config.maxAttempts > 0 && this.config.maxAttempts <= this.attempts) return;

                    try {
                        if (binaryOp === '/' || binaryOp === '%') {
                            const rhsVal = this.evaluateWithCache(finalRhsNode);
                            if (Math.abs(rhsVal) < 1e-12) continue; // Division/Modulo by zero (use small epsilon)
                        }
                        if (binaryOp === '^') {
                            const lhsVal = this.evaluateWithCache(currentAst);
                            if (Math.abs(lhsVal - 1) < 1e-12) continue; // Avoid 1^x
                            const rhsVal = this.evaluateWithCache(finalRhsNode);
                            if (Math.abs(lhsVal) < 1e-12 && rhsVal < 0) continue; // Avoid 0 to a negative power
                            if (lhsVal < 0 && Math.abs(rhsVal % 1) > 1e-12) continue; // Avoid negative base to fractional power
                        }

                        const combinedAst = new BinaryOpNode(currentAst, binaryOp, finalRhsNode);
                        yield* this.findCombinationsRecursive(combinedAst, nextRemainingNumbersAfterRhs, target, depth + 1);
                    } catch (e) { /* Evaluation error during applicability check, skip */
                    }
                }
            }
        }
    }

    private checkSolution(node: ASTNode, target: number): boolean {
        try {
            const result = this.evaluateWithCache(node);
            return Math.abs(result - target) < 1e-9; // Tolerance for float comparison
        } catch {
            return false;
        }
    }

    private evaluateWithCache(node: ASTNode): number {
        // TODO: 这里实际上应该是 hash
        const key = node.toString();
        const cached = this.cache.get(key);
        if (cached !== undefined) return cached;

        const result = node.evaluate();
        if (!isFinite(result) || isNaN(result)) {
            throw new Error('Invalid evaluation result');
        }
        this.cache.set(key, result);
        return result;
    }

    private getFactorialDepth(node: ASTNode): number {
        let depth = 0;
        let currentNode = node;
        while (currentNode instanceof UnaryOpNode && currentNode.operator === '!') {
            depth++;
            currentNode = currentNode.operand;
        }
        return depth;
    }

    private createProgressReport(): SolverReport {
        const duration = Date.now() - this.startTime;
        return {
            type: 'progress',
            attempts: this.attempts,
            eta: this.calculateETA(duration),
            progress: this.calculateProgress(duration),
            duration
        };
    }

    private calculateProgress(elapsed: number): number {
        if (this.config.maxAttempts <= 0) return Math.min(elapsed / this.config.timeout, 1); // Time based if no max attempts
        return Math.min(this.attempts / this.config.maxAttempts, elapsed / this.config.timeout, 1);

    }

    private calculateETA(elapsed: number): number {
        const progress = this.calculateProgress(elapsed);
        if (progress < 1e-9) return this.config.timeout; // Avoid division by zero if progress is negligible
        const estimatedTotalTime = elapsed / progress;
        const eta = estimatedTotalTime - elapsed;
        return Math.max(0, eta);
    }
}

// 函数求解形式
export function* solving(
    numbers: number[],
    target: number,
    config?: SolverConfig
): Generator<SolverReport, SolutionResult, unknown> {
    const solver = new Solver(config);
    return yield* solver.solve(numbers, target);
}

export async function solve(
    numbers: number[],
    target: number,
    config?: SolverConfig,
    onReport?: (report: SolverReport) => void
): Promise<SolutionResult> {
    const solver = new Solver(config);
    const generator = solver.solve(numbers, target);
    let result = generator.next();
    while (!result.done) {
        onReport?.(result.value)
        if (result.value.type === 'solution' && config?.maxAttempts === 0) {
            // Potentially break early if one solution is enough
        }
        result = generator.next();
    }
    return result.value;
}