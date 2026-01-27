import chalk from 'chalk';

/**
 * Simple logger utility dengan warna
 */

export class Logger {
  static info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message) {
    console.log(chalk.green('✓'), message);
  }

  static error(message) {
    console.log(chalk.red('✗'), message);
  }

  static warning(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  static data(label, value) {
    console.log(chalk.cyan(label + ':'), value);
  }

  static header(message) {
    console.log('\n' + chalk.bold.magenta('═'.repeat(50)));
    console.log(chalk.bold.magenta(message));
    console.log(chalk.bold.magenta('═'.repeat(50)) + '\n');
  }

  static section(message) {
    console.log('\n' + chalk.bold.cyan(message));
    console.log(chalk.cyan('─'.repeat(40)));
  }
}

export default Logger;
