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

exports = module.exports = function (options) {
  //merge default options
  options = _.merge({}, { model: 'Message' }, options);

  //ensure singletons
  try {
    //try to obtain existing Message model instance
    Message = mongoose.model(options.model);
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
    MessageSchema.statics._queue = kue.createQueue(options);


    /**
     * register, compile and exports mongoose model
     * @type {mongoose.Model}
     */
    Message = mongoose.model(options.model, MessageSchema);

  }

  //export message model
  return Message;

};