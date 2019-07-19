import Winston from 'winston';

export const logger = Winston.createLogger({
    level: 'error',
    format: Winston.format.combine(
        Winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        Winston.format.errors({ stack: true }),
        Winston.format.splat(),
        Winston.format.json()
    ),
    transports: [
        new Winston.transports.Console
    ]
});

export default logger;
