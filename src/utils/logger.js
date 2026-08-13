import chalk from 'chalk';

export const logger = {
  info: (msg) => console.log(chalk.blue('ℹ [INFO] ') + msg),
  success: (msg) => console.log(chalk.green('✔ [SUCCESS] ') + msg),
  warn: (msg) => console.log(chalk.yellow('⚠ [WARNING] ') + msg),
  error: (msg) => console.log(chalk.red('✖ [ERROR] ') + msg),
  step: (stepNum, title) => console.log(`\n${chalk.cyan(`=== STEP ${stepNum}: ${title} ===`)}`),
  table: (data) => console.table(data)
};
