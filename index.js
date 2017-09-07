'use strict';

/**
 * @module open311-messages
 * @version 0.1.0
 * @description open311 module to send notification messages i.e email, sms, push etc
 * @author lally elias <lallyelias87@gmail.com>
 * @public
 */

//dependencies
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const kue = require('kue');
const MessageSchema = require(path.join(__dirname, 'lib', 'message'));
let Message;
const modelName = 'Message';

exports = module.exports = function (options) {
  //merge default options
  options = _.merge({}, { fake: false }, options);

  //ensure proper queue
  const useFakeQueue = options.fake;

  //ensure singletons
  try {
    //try to obtain existing Message model instance
    Message = mongoose.model(modelName);
  }

  //no Message model exist continue
  catch (error) {
    /**
     * @name uuid
     * @description message instance uuid used to assert singleton
     * @since 0.1.0
     * @private
     */
    MessageSchema.statics._uuid = Math.ceil(Math.random() * 99999);

    /**
     * @name queue
     * @description message queue
     * @since 0.1.0
     * @private
     */
    MessageSchema.statics._queue =
      (useFakeQueue ? undefined : kue.createQueue(options));


    /**
     * register, compile and exports mongoose model
     * @type {mongoose.Model}
     */
    Message = mongoose.model(modelName, MessageSchema);

  }

  //ensure options
  Message.options = _.merge({}, Message.options, options);

  //export message model
  return Message;

};