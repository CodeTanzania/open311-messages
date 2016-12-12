'use strict';

/**
 * @module message
 * @description mongoose model to manage messages
 * @version 0.1.0
 * @author lally elias <lallyelias87@gmail.com>
 * @public
 */

//dependencies
const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');
let Schema = mongoose.Schema;
const Mixed = Schema.Types.Mixed;

/**
 * message directions
 */
const DIRECTION_OUTBOUND = 'Outbound';
const DIRECTION_INBOUND = 'Inbound';

/**
 * message types
 */
const TYPE_SMS = 'SMS';
const TYPE_EMAIL = 'EMAIL';
const TYPE_PUSH = 'PUSH';

/**
 * messages priorities
 */
const PRIORITY_LOW = 'low';
const PRIORITY_NORMAL = 'normal';
const PRIORITY_MEDIUM = 'medium';
const PRIORITY_HIGH = 'high';
const PRIORITY_CRITICAL = 'critical';

const modelName = 'Message';


/**
 * @name MessageSchema
 * @description message schema
 * @type {Schema}
 */
let MessageSchema = new Schema({
  /**
   * @name type
   * @description message type i.e SMS, e-mail, push etc
   * @type {Object}
   */
  type: {
    type: String,
    default: TYPE_EMAIL,
    enum: [TYPE_EMAIL, TYPE_SMS, TYPE_PUSH],
    index: true
  },


  /**
   * @name direction
   * @description message direction i.e received or sending
   * @since 0.1.0
   * @type {Object}
   */
  direction: {
    type: String,
    enum: [DIRECTION_INBOUND, DIRECTION_OUTBOUND],
    default: DIRECTION_OUTBOUND,
    index: true
  },


  /**
   * @name from
   * @description sender of the message
   * i.e e-mail sender, message sender etc
   * @since 0.1.0 
   * @type {Object}
   * @private
   */
  from: {
    type: String,
    required: true,
    index: true
  },


  /**
   * @name to
   * @description receiver(s) of the message
   * i.e e-mail receiver, message receiver etc 
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  to: {
    type: [String],
    required: true,
    index: true
  },


  /**
   * @name cc
   * @description receiver(s) of the carbon copy of the message
   * i.e e-mail cc receiver 
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  cc: {
    type: [String],
    index: true
  },


  /**
   * @name bcc
   * @description receiver(s) of the blind carbon copy of the message
   * i.e e-mail cc receiver 
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  bcc: {
    type: [String],
    index: true
  },


  /**
   * @name body
   * @description content of the message to be conveyed to receiver(s)
   * e.g Hello
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  body: {
    type: String,
    required: true
  },


  /**
   * @name sentAt
   * @description time when message was send successfully to a receiver
   * if message send succeed, set the result and update sent time
   * @since 0.1.0
   * @type {Object}
   */
  sentAt: {
    type: Date,
    index: true
  },


  /**
   * @name failedAt
   * @description last time when message to a receiver failed
   * if message send failed just set the result and set failed time
   * @since 0.1.0
   * @type {Object}
   */
  failedAt: {
    type: Date,
    index: true
  },


  /**
   * @name result
   * @description message send result i.e success or failure response
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  result: {
    type: Mixed
  },


  /**
   * @name transport
   * @description node module name or path used to actual send the message
   * it set-ed by a transport when used to send message
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  transport: {
    type: String
  },


  /**
   * @name queueName
   * @queue name of the queue that transport worker(s) will be using to
   *        enqueue message(s) for sending.
   *        
   *        If queue name not provided, the name of the queue will be derived
   *        from message type(lowercased)
   *        
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  queueName: {
    type: String,
    required: true,
    index: true
  },


  /**
   * @name priority
   * @description message sending priority
   * @see {@link https://github.com/Automattic/kue#job-priority}
   * @since 0.1.0
   * @type {Object}
   */
  priority: {
    type: String,
    default: PRIORITY_NORMAL,
    enum: [
      PRIORITY_LOW, PRIORITY_NORMAL,
      PRIORITY_MEDIUM, PRIORITY_HIGH,
      PRIORITY_CRITICAL
    ],
    index: true
  }

}, {
  timestamps: true
});


//------------------------------------------------------------------------------
// hooks
//------------------------------------------------------------------------------

/**
 * @name preValidate
 * @description message schema pre validate hook
 * @private
 */
MessageSchema.pre('validate', function preValidate(next) {

  //ensure `to` field is in array format
  if (this.to && _.isString(this.to)) {
    this.to = [].concat(this.to);
  }

  //ensure `cc` field is in array format
  if (this.cc && _.isString(this.cc)) {
    this.cc = [].concat(this.cc);
  }

  //ensure `bcc` field is in array format
  if (this.bcc && _.isString(this.bcc)) {
    this.bcc = [].concat(this.bcc);
  }

  //ensure message `queue` name
  if (!this.queueName) {
    this.queueName = this.type.toLowerCase();
  }

  next();

});


//------------------------------------------------------------------------------
// instance properties & methods
//------------------------------------------------------------------------------

/**
 * @name _send
 * @description send this message using actual transport
 * @param  {Function} done a callback to invoke on success or failure
 * @type {Function}
 * @since 0.1.0
 * @private
 */
MessageSchema.methods._send = function (done) {

  //this refer to Message instance context

  try {
    //obtain message transport
    const transport = require(this.transport);

    async.waterfall([

      function send(next) {

        //this refer to Message instance context

        transport.send(this, function (error, result) {

          //this refer to Message instance context

          //update last send fail details
          if (error) {
            this.failedAt = new Date();
            this.result = error;
          }

          //update success details
          else {
            this.sentAt = new Date();
            this.result = result;
          }

        }.bind(this));

        next(null, this);

      }.bind(this),

      function update(message, next) {
        message.save(function (error, _message) {
          next(error, _message);
        });
      }

    ], done);

  } catch (error) {
    done(error);
  }

};


/**
 * @name send
 * @description send this push notification using actual transport or 
 *              log it on console
 * @param {Object} [options] valid send options
 * @param {Boolean} [options.fake] send fake message
 * @param  {Function} done a callback to invoke on success or failure
 * @type {Function}
 * @since 0.1.0
 * @private
 * @example
 *
 * //fake send
 * message.send({fake:true}, function(error, message){
 *   ...
 * });
 *
 * //actual send
 * message.send(function(error, message){
 *  ...
 * });
 */
MessageSchema.methods.send = function send(options, done) {

  //this refer to Message instance context

  //normalize args
  if (options && _.isFunction(options)) {
    done = options;
    options = {};
  }

  //merge options
  options = _.merge({}, options);

  //send fake message
  if (options.fake) {

    this.sentAt = new Date();

    //fake message result
    this.response = {
      message: 'success'
    };

    this.save(function (error, message) {
      done(error, message);
    });

  }

  //send message using actual transport
  else {
    this._send(done);
  }

};


/**
 * @name queue
 * @description queue message for later send
 * @param  {Object}  [options] valid queue options
 * @param  {Number}  [options.retries] number of retries
 * @param  {Number}  [options.backoff] backoff strategy
 * @param  {Boolen}  [options.fake] signal to simulate push notification send
 * @return {Message} an instance of queued message
 * @type {Function}
 * @since 0.1.0
 * @private
 * @example
 * 
 * message.queue();
 *
 * or with options
 *
 * message.queue(options);
 * 
 */
MessageSchema.methods.queue = function queue(options) {

  //this refer to Message instance context

  //reference
  const Message = mongoose.model(modelName);

  //merge options
  options = _.merge({}, {

    //number of attempts to send message
    //@see {@link https://github.com/Automattic/kue#failure-attempts}
    attempts: 3,

    // back-off strategy to use on each sent failure
    // @see {@link https://github.com/Automattic/kue#failure-backoff}
    backoff: 'exponential'

  }, options);


  this.save(function (error, message) {

    //notify error
    if (error) {
      Message._queue.emit('message:queue:error', error);
    }

    //queue message for later send
    else {
      //create message sent job and queue it
      let job =
        Message._queue.create(message.queueName, message.toObject());

      //set job prioroty
      job.priority(message.priority);

      //set job number of attempt to try send message
      job.attempts(options.attempts);

      //set backoff strategy to use on message sending failures
      job.backoff({ type: options.backoff });

      job.save(function (error) {
        if (error) {
          Message._queue.emit('message:queue:error', error);
        } else {
          Message._queue.emit('message:queue:success', message);
        }
      });
    }

  });

};


//------------------------------------------------------------------------------
// static properties & methods
//------------------------------------------------------------------------------

/**
 * message directions
 */
MessageSchema.statics.DIRECTION_INBOUND = DIRECTION_INBOUND;
MessageSchema.statics.DIRECTION_OUTBOUND = DIRECTION_OUTBOUND;
MessageSchema.statics.DIRECTIONS = [DIRECTION_OUTBOUND, DIRECTION_OUTBOUND];

/**
 * message types
 */
MessageSchema.statics.TYPE_SMS = TYPE_SMS;
MessageSchema.statics.TYPE_EMAIL = TYPE_EMAIL;
MessageSchema.statics.TYPE_PUSH = TYPE_PUSH;
MessageSchema.statics.TYPES = [TYPE_SMS, TYPE_EMAIL, TYPE_PUSH];

/**
 * mesage priorities
 */
MessageSchema.statics.PRIORITY_LOW = PRIORITY_LOW;
MessageSchema.statics.PRIORITY_NORMAL = PRIORITY_NORMAL;
MessageSchema.statics.PRIORITY_MEDIUM = PRIORITY_MEDIUM;
MessageSchema.statics.PRIORITY_HIGH = PRIORITY_HIGH;
MessageSchema.statics.PRIORITY_CRITICAL = PRIORITY_CRITICAL;
MessageSchema.statics.PRIORITIES = [
  PRIORITY_LOW, PRIORITY_NORMAL,
  PRIORITY_MEDIUM, PRIORITY_HIGH,
  PRIORITY_CRITICAL
];


/**
 * @name unsent
 * @description obtain unsent message(s)
 * @param {Object} [criteria] valid mongoose query criteria
 * @param  {Function} done a callback to invoke on success or failure
 * @type {Function}
 * @return {Array[Message]} collection of unsent push notifications
 * @since 0.1.0
 * @public
 * @example
 *
 * Message.unsent(function(error, unsents){
 *     ...
 *     //process error
 *     //process unsents
 *     ...
 * });
 *
 * or specify criteria
 *
 * Message.unsent(criteria, function(error, unsents){
 *     ...
 *     //process error
 *     //process unsents
 *     ...
 * });
 * 
 */
MessageSchema.statics.unsent = function unsent(criteria, done) {

  //this refer to Message static context


  //normalize arguments
  if (criteria && _.isFunction(criteria)) {
    done = criteria;
    criteria = {};
  }

  criteria = _.merge({}, {
    sentAt: null //ensure message have not been sent
  }, criteria);

  //find unsent messages
  this.find(criteria, done);

};


/**
 * @name sent
 * @description obtain already sent message(s)
 * @param {Object} [criteria] valid mongoose query criteria
 * @param  {Function} done a callback to invoke on success or failure
 * @type {Function}
 * @return {Array[Message]} collection of already sent message(s)
 * @public
 * @since 0.1.0
 * @example
 *
 * Message.sent(function(error, sents){
 *     ...
 *     //process error
 *     //process sents
 *     ...
 * })
 *
 * or specify criteria
 *
 * Message.sent(criteria, function(error, sents){
 *     ...
 *     //process error
 *     //process sents
 *     ...
 * })
 * 
 */
MessageSchema.statics.sent = function sent(criteria, done) {

  //this refer to Message static context

  //normalize arguments
  if (criteria && _.isFunction(criteria)) {
    done = criteria;
    criteria = {};
  }

  criteria = _.merge({}, {
    sentAt: { $ne: null } //ensure push notification have been sent
  }, criteria);

  //find sent push notification
  this.find(criteria, done);

};


/**
 * export message schema
 * @type {mongoose.Schema}
 */
exports = module.exports = MessageSchema;