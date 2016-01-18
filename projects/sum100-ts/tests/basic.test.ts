// 基础功能测试

import {describe, expect, it} from 'vitest';
import {
    BinaryOpNode,
    ConcatNode,
    ExpressionNode,
    NumberNode,
    parseInput,
    Parser,
    renderToLatex,
    renderToMathematica,
    renderToText,
    solve,
    SolverReport,
    solving,
    UnaryOpNode
} from '../src/index.js';

describe('AST节点测试', () => {
    it('数字节点应该正确计算', () => {
        const node = new NumberNode(42);
        expect(node.evaluate()).toBe(42);
    });

    it('二元运算节点应该正确计算', () => {
        const left = new NumberNode(3);
        const right = new NumberNode(4);

        const addNode = new BinaryOpNode(left, '+', right);
        expect(addNode.evaluate()).toBe(7);

        const mulNode = new BinaryOpNode(left, '*', right);
        expect(mulNode.evaluate()).toBe(12);

        const powNode = new BinaryOpNode(left, '^', right);
        expect(powNode.evaluate()).toBe(81);
    });

    it('一元运算节点应该正确计算', () => {
        const node = new NumberNode(4);

        const factNode = new UnaryOpNode('!', node);
        expect(factNode.evaluate()).toBe(24);

        const sqrtNode = new UnaryOpNode('√', node);
        expect(sqrtNode.evaluate()).toBe(2);

        const negNode = new UnaryOpNode('-', node);
        expect(negNode.evaluate()).toBe(-4);
    });

    it('数字连接节点应该正确计算', () => {
        const node = new ConcatNode([1, 2, 3]);
        expect(node.evaluate()).toBe(123);
    });

    it('表达式节点应该正确验证', () => {
        const left = new BinaryOpNode(
            new NumberNode(1),
            '+',
            new NumberNode(99)
        );
        const expr = new ExpressionNode(left, 100);

        expect(expr.isValid()).toBe(true);
    });
});

describe('解析器测试', () => {
    it('应该正确解析输入', () => {
        const result = parseInput('1 2 3 4 5 6 7 8 9 = 100');
        expect(result.numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(result.target).toBe(100);
    });

    it('应该正确解析表达式', () => {
        const parser = new Parser();
        const expr = parser.parse('1 + 2 * 3 = 7');

        expect(expr.isValid()).toBe(true);
        expect(expr.evaluate()).toBe(7);
    });

    it('应该处理阶乘运算', () => {
        const parser = new Parser();
        const expr = parser.parse('4! + 4 = 28');

        expect(expr.isValid()).toBe(true);
        expect(expr.evaluate()).toBe(28);
    });
});

describe('求解器测试', () => {
    it('应该找到简单的解', async () => {
        const result = await solve([1, 2, 3], 6, {
            maxAttempts: 100,
            timeout: 2000
        });

        expect(result.found).toBe(true);
        expect(result.expression.isValid()).toBe(true);
    });

    it('应该处理数字连接', async () => {
        const result = await solve([1, 2, 3], 123, {
            maxAttempts: 10000,
            timeout: 5000,
            enableConcatenation: true,
            enableAddition: false,
            enableSubtraction: false,
            enableMultiplication: false,
            enableDivision: false,
            enablePower: false,
            enableFactorial: false,
            enableSquareRoot: false,
            enableNegation: false,
            enableModulo: false
        });

        console.log('数字连接测试结果:', result.found, result.attempts);
        if (result.found) {
            console.log('找到的表达式:', result.expression.toString());
        }

        expect(result.found).toBe(true);
        expect(result.expression.isValid()).toBe(true);
    });

    it('应该在无解时返回正确状态', async () => {
        const result = await solve([1], 100, {
            maxAttempts: 10,
            timeout: 1000
        });

        expect(result.found).toBe(false);
    });

    it('应该使用generator模式报告进度', () => {
        const reports: SolverReport[] = [];
        const generator = solving([1, 2, 3], 6, {
            maxAttempts: 100,
            timeout: 2000,
            reportInterval: 50
        });

        let result = generator.next();
        while (!result.done) {
            reports.push(result.value);
            result = generator.next();
            // 限制测试时间
            if (reports.length > 10) break;
        }

        expect(reports.length).toBeGreaterThan(0);
        expect(reports.some(r => r.type === 'progress')).toBe(true);
    });

    it('应该支持运算开关', async () => {
        // 测试禁用加法
        const result1 = await solve([1, 2], 3, {
            maxAttempts: 100,
            timeout: 1000,
            enableAddition: false,
            enableSubtraction: true,
            enableMultiplication: true
        });

        // 测试禁用所有运算
        const result2 = await solve([1, 2], 3, {
            maxAttempts: 100,
            timeout: 1000,
            enableAddition: false,
            enableSubtraction: false,
            enableMultiplication: false,
            enableDivision: false,
            enablePower: false,
            enableFactorial: false,
            enableSquareRoot: false,
            enableNegation: false,
            enableModulo: false
        });

        // 第一个测试可能找到解（使用减法或乘法）
        // 第二个测试应该找不到解（所有运算都被禁用）
        expect(result2.found).toBe(false);
    });
});

describe('渲染器测试', () => {
    it('应该正确渲染为文本', async () => {
        const result = await solve([1, 2], 3, {
            maxAttempts: 100,
            timeout: 1000
        });

        if (result.found) {
            const text = renderToText(result);
            expect(text).toContain('=');
            expect(text).toContain('3');
        }
    });

    it('应该正确渲染为LaTeX', async () => {
        const result = await solve([2, 2], 4, {
            maxAttempts: 100,
            timeout: 1000
        });

        if (result.found) {
            const latex = renderToLatex(result);
            expect(latex).toContain('=');
            expect(latex).toContain('4');
        }
    });

    it('应该正确渲染为Mathematica', async () => {
        const result = await solve([2, 2], 4, {
            maxAttempts: 100,
            timeout: 1000
        });

        if (result.found) {
            const mathematica = renderToMathematica(result);
            expect(mathematica).toContain('==');
            expect(mathematica).toContain('4');
        }
    });
});

describe('错误处理测试', () => {
    it('应该处理除零错误', () => {
        const node = new BinaryOpNode(
            new NumberNode(1),
            '/',
            new NumberNode(0)
        );

        expect(() => node.evaluate()).toThrow('Division by zero');
    });

    it('应该处理负数阶乘错误', () => {
        const node = new UnaryOpNode('!', new NumberNode(-1));

        expect(() => node.evaluate()).toThrow('Factorial only defined for non-negative integers');
    });

    it('应该处理负数开方错误', () => {
        const node = new UnaryOpNode('√', new NumberNode(-1));

        expect(() => node.evaluate()).toThrow('Square root of negative number');
    });

    it('应该处理解析错误', () => {
        expect(() => parseInput('invalid input')).toThrow();
        expect(() => parseInput('1 2 3 = abc')).toThrow();
    });
});