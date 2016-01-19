// 测试设置文件

// 这里可以添加全局测试设置

import {solve} from "../src";

const result = solve([1, 2, 3], 123, {
    maxAttempts: 10000,
    timeout: 2000,
    enableConcatenation: true
}).then(console.info);