'use strict';

function DetailedError (message, details) {
  Error.call(this, message);
  this.message = message;
  this.details = details;
};

DetailedError.prototype.toJSON = function toJSON () {
  return {
    message: this.message,
    details: this.details
  };
};

module.exports = DetailedError;
