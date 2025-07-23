const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const retryAsync = async (callback, { limit = 1, onTry, onError }) => {
  const errors = [];

  for (let tentativa = 1; tentativa <= limit; tentativa++) {
    await onTry?.(tentativa);
    try {
      const result = await callback();
      return { result, errors };
    } catch (err) {
      await onError?.(err, tentativa);
      errors.push(err);
    }
  }

  return { result: null, errors };
};

module.exports = {
  sleep,
  retryAsync,
};
