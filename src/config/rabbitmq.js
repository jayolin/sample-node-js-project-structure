import config from "dotenv-extended";
// load environment variables - make sure this is always called as early as possible
config.load();
import amqp from "amqplib";
let connectionString;
switch (process.env.ENVIRONMENT) {
  case "production":
    connectionString = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_DOMAIN}:${process.env.RABBITMQ_PORT}`;
    break;
  case "staging":
    connectionString = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_DOMAIN}:${process.env.RABBITMQ_PORT}`;
    break;
  default:
    connectionString = `amqp://${process.env.RABBITMQ_DEV_USERNAME}:${process.env.RABBITMQ_DEV_PASSWORD}@${process.env.RABBITMQ_DOMAIN}:${process.env.RABBITMQ_PORT}`;
    break;
}
// console.log({ connectionString });
const connection = async () => {
  try {
    let connection = await amqp.connect(connectionString);
    let channel = await connection.createConfirmChannel();

    return {
      connection,
      channel
    };
  } catch (error) {
    throw new Error(error);
  }
};
//Export it to make it available outside
module.exports.rabbitmq = connection;
