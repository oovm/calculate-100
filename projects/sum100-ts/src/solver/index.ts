// 求解器实现

import {ASTNode, BinaryOpNode, ConcatNode, ExpressionNode, NumberNode, UnaryOpNode} from '../ast/index.js';

// 求解结果
export interface SolutionResult {
    expression: ExpressionNode;
    attempts: number;
    duration: number;
    found: boolean;
}

// 求解进度回调
export interface SolverProgress {
    attempts: number;
    solutions: ExpressionNode[];
    eta: number; // 预计剩余时间（毫秒）
    progress: number; // 0-1之间的进度
}

export type ProgressCallback = (progress: SolverProgress) => void;

// 求解器配置
export interface SolverConfig {
    maxAttempts?: number;
    timeout?: number; // 毫秒
    maxFactorialDepth?: number;
    enableConcatenation?: boolean;
    progressCallback?: ProgressCallback;
    progressInterval?: number; // 进度回调间隔（毫秒）
}

// 表达式生成器状态
interface GeneratorState {
    numbers: number[];
    target: number;
    usedIndices: Set<number>;
    currentExpr?: ASTNode;
    depth?: number;
}

// 记忆化缓存
class AttemptionCache {
    private cache = new Map<string, number>();

    get(key: string): number | undefined {
        return this.cache.get(key);
    }

    set(key: string, value: number): void {
        if (this.cache.size > 10000) { // 限制缓存大小
            this.cache.clear();
        }
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }
}

export class Solver {
    private cache = new AttemptionCache();
    private startTime = 0;
    private attempts = 0;
    private solutions: ExpressionNode[] = [];
    private config: Required<SolverConfig>;
    private cancelled = false;
    private lastProgressTime = 0;

    constructor(config: SolverConfig = {}) {
        this.config = {
            maxAttempts: config.maxAttempts ?? 1000000,
            timeout: config.timeout ?? 30000,
            maxFactorialDepth: config.maxFactorialDepth ?? 3,
            enableConcatenation: config.enableConcatenation ?? true,
            progressCallback: config.progressCallback ?? (() => {
            }),
            progressInterval: config.progressInterval ?? 100
        };
    }

    cancel(): void {
        this.cancelled = true;
    }

    async solve(numbers: number[], target: number): Promise<SolutionResult> {
        this.reset();
        this.startTime = Date.now();

        try {
            await this.generateExpressions(numbers, target);
        } catch (error) {
            if (error instanceof Error && error.message === 'CANCELLED') {
                // 被取消
            } else {
                throw error;
            }
        }

        const duration = Date.now() - this.startTime;

        return {
            expression: this.solutions[0] || new ExpressionNode(new NumberNode(0), target),
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
        this.lastProgressTime = 0;
    }

    private async generateExpressions(numbers: number[], target: number): Promise<void> {
        // 生成所有可能的表达式
        await this.generateRecursive({
            numbers,
            target,
            usedIndices: new Set()
        });
    }

    private async generateRecursive(state: GeneratorState): Promise<void> {
        if (this.cancelled) {
            throw new Error('CANCELLED');
        }

        if (this.attempts >= this.config.maxAttempts) {
            return;
        }

        if (Date.now() - this.startTime >= this.config.timeout) {
            return;
        }

        // 更新进度
        if (Date.now() - this.lastProgressTime >= this.config.progressInterval) {
            this.updateProgress(state);
            this.lastProgressTime = Date.now();
            // 让出控制权给事件循环
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // 尝试单个数字
        for (let i = 0; i < state.numbers.length; i++) {
            if (state.usedIndices.has(i)) continue;

            const num = state.numbers[i];
            const node = new NumberNode(num);

            if (this.checkSolution(node, state.target)) {
                this.solutions.push(new ExpressionNode(node, state.target));
                if (this.solutions.length >= 10) return; // 限制解的数量
            }

            // 递归构建更复杂的表达式
            await this.buildComplexExpressions({
                ...state,
                usedIndices: new Set([...state.usedIndices, i]),
                currentExpr: node,
                depth: (state.depth || 0) + 1
            });
        }

        // 尝试数字连接
        if (this.config.enableConcatenation) {
            await this.tryNumberConcatenation(state);
        }
    }

    private async buildComplexExpressions(state: GeneratorState): Promise<void> {
        if (!state.currentExpr) return;

        // 限制递归深度防止栈溢出
        const maxDepth = 6;
        if ((state.depth || 0) >= maxDepth) return;

        // 尝试一元运算
        await this.tryUnaryOperations(state);

        // 尝试二元运算
        await this.tryBinaryOperations(state);
    }

    private async tryUnaryOperations(state: GeneratorState): Promise<void> {
        if (!state.currentExpr) return;

        const operators: Array<'!' | '√' | '-'> = ['!', '√', '-'];

        for (const op of operators) {
            try {
                // 检查阶乘深度限制
                if (op === '!' && this.getFactorialDepth(state.currentExpr) >= this.config.maxFactorialDepth) {
                    continue;
                }

                const node = new UnaryOpNode(op, state.currentExpr);
                this.attempts++;

                if (this.checkSolution(node, state.target)) {
                    this.solutions.push(new ExpressionNode(node, state.target));
                    if (this.solutions.length >= 10) return;
                }

                // 继续递归
                await this.buildComplexExpressions({
                    ...state,
                    currentExpr: node,
                    depth: (state.depth || 0) + 1
                });

            } catch (error) {
                // 忽略计算错误（如负数开方、除零等）
                continue;
            }
        }
    }

    private async tryBinaryOperations(state: GeneratorState): Promise<void> {
        if (!state.currentExpr) return;

        const operators: Array<'+' | '-' | '*' | '/' | '%' | '^'> = ['+', '-', '*', '/', '%', '^'];

        for (const op of operators) {
            // 为右操作数尝试所有未使用的数字
            for (let i = 0; i < state.numbers.length; i++) {
                if (state.usedIndices.has(i)) continue;

                const rightNum = state.numbers[i];
                const rightNode = new NumberNode(rightNum);

                try {
                    const node = new BinaryOpNode(state.currentExpr, op, rightNode);
                    this.attempts++;

                    if (this.checkSolution(node, state.target)) {
                        this.solutions.push(new ExpressionNode(node, state.target));
                        if (this.solutions.length >= 10) return;
                    }

                    // 继续递归
                    await this.buildComplexExpressions({
                        ...state,
                        usedIndices: new Set([...state.usedIndices, i]),
                        currentExpr: node,
                        depth: (state.depth || 0) + 1
                    });

                } catch (error) {
                    // 忽略计算错误
                    continue;
                }
            }
        }
    }

    private async tryNumberConcatenation(state: GeneratorState): Promise<void> {
        // 尝试连接2-4个连续数字
        for (let len = 2; len <= Math.min(4, state.numbers.length); len++) {
            for (let start = 0; start <= state.numbers.length - len; start++) {
                const indices = Array.from({length: len}, (_, i) => start + i);

                // 检查是否有重复使用的索引
                if (indices.some(i => state.usedIndices.has(i))) continue;

                const numbers = indices.map(i => state.numbers[i]);
                const node = new ConcatNode(numbers);

                try {
                    this.attempts++;

                    if (this.checkSolution(node, state.target)) {
                        this.solutions.push(new ExpressionNode(node, state.target));
                        if (this.solutions.length >= 10) return;
                    }

                    // 继续递归
                    await this.buildComplexExpressions({
                        ...state,
                        usedIndices: new Set([...state.usedIndices, ...indices]),
                        currentExpr: node,
                        depth: (state.depth || 0) + 1
                    });

                } catch (error) {
                    continue;
                }
            }
        }
    }

    private checkSolution(node: ASTNode, target: number): boolean {
        try {
            const result = this.evaluateWithMemo(node);
            return Math.abs(result - target) < 1e-10;
        } catch {
            return false;
        }
    }

    private evaluateWithMemo(node: ASTNode): number {
        const key = node.toString();
        const cached = this.cache.get(key);

        if (cached !== undefined) {
            return cached;
        }

        const result = node.evaluate();

        // 检查结果是否有效
        if (!isFinite(result) || isNaN(result)) {
            throw new Error('Invalid result');
        }

        this.cache.set(key, result);
        return result;
    }

    private getFactorialDepth(node: ASTNode): number {
        if (node instanceof UnaryOpNode && node.operator === '!') {
            return 1 + this.getFactorialDepth(node.operand);
        }
        return 0;
    }

    private updateProgress(state: GeneratorState): void {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(this.attempts / this.config.maxAttempts, elapsed / this.config.timeout);
        const eta = progress > 0 ? (elapsed / progress) - elapsed : this.config.timeout;

        this.config.progressCallback({
            attempts: this.attempts,
            solutions: [...this.solutions],
            eta: Math.max(0, eta),
            progress
        });
    }
}

// 便捷函数
export async function solve(
    numbers: number[],
    target: number,
    config?: SolverConfig
): Promise<SolutionResult> {
    const solver = new Solver(config);
    return solver.solve(numbers, target);
}