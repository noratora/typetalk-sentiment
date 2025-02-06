export const handler = async (event) => {
  let response = {
    isAuthorized: false,
  };

  if (event.headers.secretkey === process.env.SECRET_KEY) {
    response = {
      isAuthorized: true,
    };
  }

  return response;
};
