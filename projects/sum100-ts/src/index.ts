// Sum-100 TypeScript 求解器主入口

// 导出AST相关
export {
    type ASTNode,
    NumberNode,
    BinaryOpNode,
    UnaryOpNode,
    ConcatNode,
    ParenNode,
    ExpressionNode
} from './ast/index.js';

// 导出解析器相关
export {
    Parser,
    parseNumberSequence,
    parseInput
} from './parser/index.js';

// 导出求解器相关
export {
    Solver,
    solve,
    type SolutionResult,
    type SolverProgress,
    type SolverConfig,
    type ProgressCallback
} from './solver/index.js';

// 导出渲染器相关
export {
    Renderer,
    HtmlRenderer,
    type RenderOptions,
    type RenderResult,
    renderToText,
    renderToLatex,
    renderMultipleToText,
    renderMultipleToLatex,
    defaultRenderer,
    htmlRenderer
} from './render/index.js';

// 便捷的完整求解函数
export async function solveExpression(
    input: string,
    config?: import('./solver/index.js').SolverConfig
): Promise<import('./solver/index.js').SolutionResult> {
    const {parseInput} = await import('./parser/index.js');
    const {solve} = await import('./solver/index.js');

    const {numbers, target} = parseInput(input);
    return solve(numbers, target, config);
}

// 版本信息
export const VERSION = '1.0.0';