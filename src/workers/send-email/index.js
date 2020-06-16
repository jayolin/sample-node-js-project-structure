import { connectDB } from "config/db";
connectDB(5, false); // connect mongodb
import { rabbitmqArchitecture } from "libs/rabbitmqArchitecture";
import { rabbitmq } from "config/rabbitmq";
import EmailWorker from "./email";
const run = async () => {
  const { channel } = await rabbitmq();
  let { queue, exchange, routingKey } = await rabbitmqArchitecture("email");
  console.log({ queue, exchange, routingKey });
  // create the exchange if it doesn't already exist
  await channel.assertExchange(exchange, "topic", { durable: true });
  // create the queue if it doesn't already exist
  let q = await channel.assertQueue(queue, { durable: true });
  // bind queue to exchange
  await channel.bindQueue(q.queue, exchange, routingKey);
  console.log(" [*] Waiting for %s. To exit press CTRL+C", queue);
  // get one message off the queue at a time
  await channel.prefetch(1);
  // consume message from queue
  await channel.consume(
    q.queue,
    async msg => {
      try {
        let message = JSON.parse(msg.content.toString());
        switch (message.action) {
          case "send":
            {
              console.log(" [Received] %s", message.type);
              await EmailWorker.sendMail(message.data);
              console.log(" [Processed] %s", "MailSent - " + message.type);
              channel.ack(msg); //acknowledged processing is complate
            }
            break;

          default:
            {
              console.log(" [Received] %s", "UnknowMessage - Send Mail");
              // unknown message type - throw it away
              channel.ack(msg); //acknowledged processing is complate
              console.log(" [Processed] %s", "UnknowMessage - Send Mail");
            }
            break;
        }
      } catch (error) {
        console.error({ SendEmailError: error });
        channel.nack(msg);
      }
    },
    { noAck: false } // ensure that message acknowledged after processed - it must be false to work like so
  );
};
// call function
run();
