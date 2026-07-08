import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.cyan('ℹ'), message);
  },
  success(message: string): void {
    console.log(chalk.green('✔'), message);
  },
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },
  error(message: string): void {
    console.error(chalk.red('✖'), message);
  },
  title(message: string): void {
    console.log(chalk.bold.blue(`\n${message}\n`));
  },
  dim(message: string): void {
    console.log(chalk.dim(message));
  },
};
