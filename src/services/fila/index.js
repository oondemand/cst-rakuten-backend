const createQueue = ({ handler, limit = 1, next, onError }) => {
  let activeTasks = 0;
  let queueRunning = false;

  const runNext = async () => {
    if (!queueRunning || activeTasks >= limit) return;

    const item = await next();
    if (!item) {
      queueRunning = false;
      return;
    }

    activeTasks++;

    handler(item)
      .catch((error) => {
        onError?.(error);
        console.error("Erro ao processar item da fila:", error);
      })
      .finally(() => {
        activeTasks--;
        runNext();
      });

    runNext();
  };

  const start = () => {
    if (queueRunning) return;
    queueRunning = true;
    runNext();
  };

  return { start };
};

module.exports = {
  createQueue,
};
