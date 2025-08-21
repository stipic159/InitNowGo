import pino from 'pino';
import { config } from '../config/config.js';

const transport = pino.transport({
  targets: [
    {
      target: './pretty-transport.js',
      level: config.logLevelConsole,
    },
    {
      target: 'pino/file',
      options: {
        destination: `${config.paths.logsFiles}/app-info.log`,
      },
      level: 'info',
    },
    {
      target: 'pino/file',
      options: {
        destination: `${config.paths.logsFiles}/app-error.log`,
      },
      level: 'error',
    },
  ],
});

const Logger = pino({ level: 'debug' }, transport);

export default Logger;
