'use strict';

/**
 * @name echo
 * @description sample echo transport to send message
 * @since 0.1.0
 * @public
 */

//dependencies
const async = require('async');
const kue = require('kue');
const mongoose = require('mongoose');
const Message = mongoose.model('Message');

exports.name = __filename;

//create worker queue
exports._queue = kue.createQueue();

exports.queueName = 'email';

exports.queue = function (message) {

  message.transport = exports.name;
  message.queueName = exports.queueName;
  message.queue();

};

exports.send = function (message, done) {
  done(null, {
    message: 'success'
  });

};

//process
exports._queue.process('email', function (job, done) {

  async.waterfall([
    function findMessage(next) {
      Message.findById(job.data._id, next);
    },
    function sendMessage(message, next) {
      message.send(next);
    }
  ], done);

});