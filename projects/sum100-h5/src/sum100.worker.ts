// Sum-100 求解器 Worker

import { solve, parseInput, SolverProgress, SolutionResult } from 'sum100-ts';

// Worker消息类型
interface WorkerMessage {
  type: 'solve' | 'cancel';
  payload?: {
    input: string;
    maxAttempts?: number;
    timeout?: number;
  };
}

// Worker响应类型
interface WorkerResponse {
  type: 'progress' | 'solution' | 'complete' | 'error';
  payload?: {
    progress?: SolverProgress;
    solution?: SolutionResult;
    error?: string;
  };
}

let currentSolver: any = null;

// 监听主线程消息
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'solve':
        if (!payload) {
          throw new Error('Missing payload for solve command');
        }
        await handleSolve(payload.input, payload.maxAttempts, payload.timeout);
        break;
        
      case 'cancel':
        handleCancel();
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    postMessage({
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as WorkerResponse);
  }
});

async function handleSolve(
  input: string,
  maxAttempts: number = 100000,
  timeout: number = 30000
): Promise<void> {
  try {
    // 解析输入
    const { numbers, target } = parseInput(input);
    
    // 创建进度回调
    const progressCallback = (progress: SolverProgress) => {
      postMessage({
        type: 'progress',
        payload: { progress }
      } as WorkerResponse);
      
      // 如果找到解，立即发送
      if (progress.solutions.length > 0) {
        progress.solutions.forEach(solution => {
          postMessage({
            type: 'solution',
            payload: {
              solution: {
                expression: solution,
                attempts: progress.attempts,
                duration: 0, // 会在完成时更新
                found: true
              }
            }
          } as WorkerResponse);
        });
      }
    };
    
    // 开始求解
    const result = await solve(numbers, target, {
      maxAttempts,
      timeout,
      enableConcatenation: true,
      maxFactorialDepth: 3,
      progressCallback,
      progressInterval: 200 // 每200ms更新一次进度
    });
    
    // 发送完成消息
    postMessage({
      type: 'complete',
      payload: {
        solution: result
      }
    } as WorkerResponse);
    
  } catch (error) {
    postMessage({
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Solve failed'
      }
    } as WorkerResponse);
  }
}

function handleCancel(): void {
  if (currentSolver && typeof currentSolver.cancel === 'function') {
    currentSolver.cancel();
  }
  
  postMessage({
    type: 'complete',
    payload: {
      solution: {
        expression: null,
        attempts: 0,
        duration: 0,
        found: false
      }
    }
  } as WorkerResponse);
}

// 导出类型供主线程使用
export type { WorkerMessage, WorkerResponse };