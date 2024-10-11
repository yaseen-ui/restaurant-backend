const orderFields = {
  availableDoughChefs: 2,
  availableToppingChefs: 3,
  availableWaiters: 2,
  availableOven: 1,

  busyDoughChefs: 0,
  busyToppingChefs: 0,
  busyOven: 0,
  busyWaiters: 0,

  doughChefQueue: [],
  toppingChefQueue: [],
  ovenQueue: [],
  waiterQueue: [],
};

const processOrder = (order, broadcast) => {
  const stages = [
    { name: "Dough Chef", duration: 7000 },
    {
      name: "Topping Chef",
      duration: 4000 * Math.ceil(order.toppings.length / 2), // each chef can handle two toppings at a time
    },
    { name: "Oven", duration: 10000 },
    { name: "Serving", duration: 5000 },
    { name: "Done", duration: 0 },
  ];

  let currentStageIndex = 0;

  const moveToNextStage = () => {
    const stage = stages[currentStageIndex];

    switch (stage.name) {
      case "Dough Chef":
        if (orderFields.busyDoughChefs < orderFields.availableDoughChefs) {
          orderFields.busyDoughChefs++;
          order.status = "Dough Chef";
          broadcast(order);
          broadcast(orderFields, "orderFields"); // Broadcast after changes
          setTimeout(() => {
            orderFields.busyDoughChefs--;
            handleNextTask(orderFields.doughChefQueue, moveToNextStage);
            currentStageIndex++;
            moveToNextStage();
          }, stage.duration);
        } else {
          orderFields.doughChefQueue.push(moveToNextStage);
        }
        break;

      case "Topping Chef":
        if (orderFields.busyToppingChefs < orderFields.availableToppingChefs) {
          orderFields.busyToppingChefs++;
          order.status = "Topping Chef";
          broadcast(order);
          broadcast(orderFields, "orderFields"); // Broadcast after changes

          setTimeout(() => {
            orderFields.busyToppingChefs--;
            handleNextTask(orderFields.toppingChefQueue, moveToNextStage);
            currentStageIndex++;
            moveToNextStage();
          }, stage.duration);
        } else {
          orderFields.toppingChefQueue.push(moveToNextStage);
        }
        break;

      case "Oven":
        if (orderFields.busyOven < orderFields.availableOven) {
          orderFields.busyOven++;
          order.status = "Oven";
          broadcast(order);
          broadcast(orderFields, "orderFields"); // Broadcast after changes

          setTimeout(() => {
            orderFields.busyOven--;
            handleNextTask(orderFields.ovenQueue, moveToNextStage);
            currentStageIndex++;
            moveToNextStage();
          }, stage.duration);
        } else {
          orderFields.ovenQueue.push(moveToNextStage);
        }
        break;

      case "Serving":
        if (orderFields.busyWaiters < orderFields.availableWaiters) {
          orderFields.busyWaiters++;
          order.status = "Serving";
          broadcast(order);
          broadcast(orderFields, "orderFields"); // Broadcast after changes

          setTimeout(() => {
            orderFields.busyWaiters--;
            order.status = "Done";
            order.timeTaken = Math.floor(
              (Date.now() - order.timeStarted) / 1000
            );
            broadcast(order);
            handleNextTask(orderFields.waiterQueue, moveToNextStage); // Handle next in queue
          }, stage.duration);
        } else {
          orderFields.waiterQueue.push(moveToNextStage);
        }
        break;

      case "Done":
        return;
    }
  };

  moveToNextStage();

  const handleNextTask = (queue, task) => {
    if (queue.length > 0) {
      const nextTask = queue.shift();
      nextTask();
    }
    console.log(orderFields, "orderFields", new Date());
    broadcast(orderFields, "orderFields"); // Moved here for better sync
  };
};

module.exports = { processOrder };
