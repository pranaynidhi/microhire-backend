// Middleware to attach Socket.io instance to requests
const attachSocket = (io) => {
    return (req, res, next) => {
      req.io = io;
      next();
    };
  };
  
  module.exports = attachSocket;
  