import { rabbitmq } from "config/rabbitmq";
import { rabbitmqArchitecture } from "libs/rabbitmqArchitecture";
export const publishToRabitmq = data => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!Array.isArray(data)) {
        data = [data];
      }
      let connection;
      if (data.length > 0) {
        let rabbitmqObj = await rabbitmq();
        connection = rabbitmqObj.connection;
        let channel = rabbitmqObj.channel;
        for (let i = 0; i < data.length; i++) {
          let { worker, message } = data[i];
          let { queue, exchange, routingKey } = await rabbitmqArchitecture(worker);
          //   console.log({ connection, channel });
          channel.on("return", function(message) {
            console.log("Message returned", message);
            // channel.close(); // close the channel
            connection.close(); // close connection
          });
          // create the exchange if it doesn't already exist
          await channel.assertExchange(exchange, "topic", { durable: true });

          // create the queue if it doesn't already exist
          let q = await channel.assertQueue(queue, { durable: true });
          // bind queue to exchange this will prevent errors that a producer try to publish to an exchange without a binded queue
          await channel.bindQueue(q.queue, exchange, routingKey);

          // publish the message to the exchange
          await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
            deliveryMode: 2,
            mandatory: true
          });
          console.log(" [√] Sent\n\n %s\n\n", JSON.stringify(message, null, 2));
        }
        // close connection after 60 milliseconds
        setTimeout(async () => {
          await connection.close();
        }, 60);
      } else {
        reject(new Error("Nothing to publish. Please provide job description"));
      }
      resolve({});
    } catch (error) {
      reject(error);
    }
  });
};
