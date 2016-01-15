// AST节点定义

// 基础AST节点接口
export interface ASTNode {
    type: string;

    evaluate(): number;

    toString(): string;

    toLatex(): string;
}

// 数字节点
export class NumberNode implements ASTNode {
    type = 'number';

    constructor(public value: number) {
    }

    evaluate(): number {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }

    toLatex(): string {
        return this.value.toString();
    }
}

// 二元运算节点
export class BinaryOpNode implements ASTNode {
    type = 'binary_op';

    constructor(
        public left: ASTNode,
        public operator: '+' | '-' | '*' | '/' | '%' | '^',
        public right: ASTNode
    ) {
    }

    evaluate(): number {
        const leftVal = this.left.evaluate();
        const rightVal = this.right.evaluate();

        switch (this.operator) {
            case '+':
                return leftVal + rightVal;
            case '-':
                return leftVal - rightVal;
            case '*':
                return leftVal * rightVal;
            case '/':
                if (rightVal === 0) throw new Error('Division by zero');
                return leftVal / rightVal;
            case '%':
                if (rightVal === 0) throw new Error('Modulo by zero');
                return leftVal % rightVal;
            case '^':
                return Math.pow(leftVal, rightVal);
            default:
                throw new Error(`Unknown operator: ${this.operator}`);
        }
    }

    toString(): string {
        return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
    }

    toLatex(): string {
        const leftLatex = this.left.toLatex();
        const rightLatex = this.right.toLatex();

        switch (this.operator) {
            case '+':
                return `${leftLatex} + ${rightLatex}`;
            case '-':
                return `${leftLatex} - ${rightLatex}`;
            case '*':
                return `${leftLatex} \\cdot ${rightLatex}`;
            case '/':
                return `\\frac{${leftLatex}}{${rightLatex}}`;
            case '%':
                return `${leftLatex} \\bmod ${rightLatex}`;
            case '^':
                return `${leftLatex}^{${rightLatex}}`;
            default:
                return `${leftLatex} ${this.operator} ${rightLatex}`;
        }
    }
}

// 一元运算节点
export class UnaryOpNode implements ASTNode {
    type = 'unary_op';

    constructor(
        public operator: '!' | '√' | '-',
        public operand: ASTNode
    ) {
    }

    evaluate(): number {
        const val = this.operand.evaluate();

        switch (this.operator) {
            case '!':
                if (val < 0 || !Number.isInteger(val)) {
                    throw new Error('Factorial only defined for non-negative integers');
                }
                if (val > 170) throw new Error('Factorial overflow');
                return this.factorial(val);
            case '√':
                if (val < 0) throw new Error('Square root of negative number');
                return Math.sqrt(val);
            case '-':
                return -val;
            default:
                throw new Error(`Unknown unary operator: ${this.operator}`);
        }
    }

    private factorial(n: number): number {
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    }

    toString(): string {
        if (this.operator === '!') {
            return `${this.operand.toString()}!`;
        }
        return `${this.operator}${this.operand.toString()}`;
    }

    toLatex(): string {
        const operandLatex = this.operand.toLatex();

        switch (this.operator) {
            case '!':
                return `${operandLatex}!`;
            case '√':
                return `\\sqrt{${operandLatex}}`;
            case '-':
                return `-${operandLatex}`;
            default:
                return `${this.operator}${operandLatex}`;
        }
    }
}

// 数字连接节点（如123表示1,2,3连接）
export class ConcatNode implements ASTNode {
    type = 'concat';

    constructor(public numbers: number[]) {
    }

    evaluate(): number {
        return parseInt(this.numbers.join(''));
    }

    toString(): string {
        return this.numbers.join('');
    }

    toLatex(): string {
        return this.numbers.join('');
    }
}

// 括号节点
export class ParenNode implements ASTNode {
    type = 'paren';

    constructor(public expression: ASTNode) {
    }

    evaluate(): number {
        return this.expression.evaluate();
    }

    toString(): string {
        return `(${this.expression.toString()})`;
    }

    toLatex(): string {
        return `\\left(${this.expression.toLatex()}\\right)`;
    }
}

// 表达式节点（整个等式）
export class ExpressionNode implements ASTNode {
    type = 'expression';

    constructor(
        public left: ASTNode,
        public target: number
    ) {
    }

    evaluate(): number {
        return this.left.evaluate();
    }

    isValid(): boolean {
        try {
            return Math.abs(this.evaluate() - this.target) < 1e-10;
        } catch {
            return false;
        }
    }

    toString(): string {
        return `${this.left.toString()} = ${this.target}`;
    }

    toLatex(): string {
        return `${this.left.toLatex()} = ${this.target}`;
    }
}