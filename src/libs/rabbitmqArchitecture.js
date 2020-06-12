export const rabbitmqArchitecture = worker => {
  return new Promise((resolve, reject) => {
    try {
      console.log({ worker });
      let exchange = "ncc-demo.exchange";
      switch (worker) {
        case "email":
          resolve({
            queue: "ncc-demo.email.queue",
            exchange,
            routingKey: "ncc-demo.email.send"
          });
          break;

        case "webhook":
          resolve({
            queue: "ncc-demo.webhook.queue",
            exchange,
            routingKey: "ncc-demo.webhook.post"
          });
          break;

        case "harmonize":
          resolve({
            queue: "ncc-demo.harmonize.queue",
            exchange,
            routingKey: "ncc-demo.harmonize.post"
          });
          break;
        case "sms":
          resolve({
            queue: "ncc-demo.sms.queue",
            exchange,
            routingKey: "ncc-demo.sms.post"
          });
          break;

        default:
          throw new Error("Invalid queue: Something bad happened!");
          break;
      }
    } catch (error) {
      reject(error);
    }
  });
};
