import pretty from 'pino-pretty';

export default function () {
  return pretty({
    colorize: true,
    translateTime: 'HH:mm:ss',
    ignore: 'pid,hostname',
  });
}
