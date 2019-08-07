const amqp = require("amqp-connection-manager");

const AMQP_URL = process.env.CLOUDAMQP_URL || "amqp://localhost";
if (!AMQP_URL) process.exit(1);

const WORKER_QUEUE = "worker-queue";

const tripHelpers = require("../common/trips");
let { createTripsForAllDevices, completeDailyTripsForallDevices } = tripHelpers;

// Create a new connection manager from AMQP
var connection = amqp.connect([AMQP_URL]);
console.log("[AMQP] - Connecting....");

connection.on("connect", function() {
  process.once("SIGINT", function() {
    // Close conn on exit
    connection.close();
  });
  return console.log("[AMQP] - Connected!");
});

connection.on("disconnect", function(params) {
  return console.error("[AMQP] - Disconnected.", params.err.stack);
});

// ---------- To receive the execution task messages
let channelWrapper = connection.createChannel({
  json: true,
  setup: function(channel) {
    return Promise.all([
      channel.assertQueue(WORKER_QUEUE, { autoDelete: false, durable: true }),
      channel.prefetch(1),
      channel.consume(WORKER_QUEUE, onMessage)
    ]);
  }
});

channelWrapper
  .waitForConnect()
  .then(function() {
    console.log("[AMQP] - Listening for messages on queue => " + WORKER_QUEUE);
  })
  .catch(function(err) {
    console.error("[AMQP] - Error! ", err);
  });

// Process message from AMQP
function onMessage(data) {
  let message;
  try {
    message = JSON.parse(data.content.toString());
  } catch (e) {
    console.error("[AMQP] - Error parsing message... ", data);
  }

  console.log("[AMQP] - Message incoming... ", message);
  channelWrapper.ack(data);
  if (!message) {
    return;
  }

  switch (message.taskName) {
    case "completeTrips":
      completeDailyTripsForallDevices();
      break;

    case "createTrips":
      createTripsForAllDevices();
      break;

    default:
      console.error("No task was found with name => " + message.taskName);
  }
}
