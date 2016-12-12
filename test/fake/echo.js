'use strict';

/**
 * @name echo
 * @description echo transport to send message
 * @since 0.1.0
 * @public
 */

exports.name = __dirname;

exports.queue = function (message) {

  message.transport = exports.name;
  message.queue();

};

exports.send = function (message, done) {

  done(null, {
    message: 'success'
  });

};