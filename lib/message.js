'use strict';

/**
 * @module message
 * @description mongoose model & queue logics to manage messages
 * @version 0.1.0
 * @author lally elias <lallyelias87@gmail.com>
 * @public
 */

//dependencies
const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');
const hash = require('object-hash');
const isHtml = require('is-html');
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
 * message mime types. Used to tell what is mime of the message body.
 * It used mostly in smtp transports to decide which content to send i.e email
 * or text.
 */
const MIME_TEXT = 'text/plain';
const MIME_HTML = 'text/html';


/**
 * messages priorities
 */
const PRIORITY_LOW = 'low';
const PRIORITY_NORMAL = 'normal';
const PRIORITY_MEDIUM = 'medium';
const PRIORITY_HIGH = 'high';
const PRIORITY_CRITICAL = 'critical';


/**
 * transport send modes
 */
const SEND_MODE_PULL = 'Pull';
const SEND_MODE_PUSH = 'Push';


/**
 * mongoose model name for the message
 */
const modelName = 'Message';


/**
 * message hash fields
 */
const HASH_FIELDS = [
  'type', 'direction', 'from', 'to',
  'transport', 'queueName', 'body', 'priority'
];


/**
 * messages state
 */
//state assigned to a message received from a transport
const STATE_RECEIVED = 'Received';


//state assigned to message to be sent by a transport mainly poll transport
const STATE_UNKNOWN = 'Unknown';


//state assigned to a message once a poll transport receive a message to send
const STATE_SENT = 'Sent';


//state assigned to a message after receiving acknowledge from poll transport
//that message have been queued for sending
const STATE_QUEUED = 'Queued';


//state assigned to a message once successfully delivered to a receiver(s)
const STATE_DELIVERED = 'Delivered';


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
   * @name mime
   * @description message mime type i.e text/plain, text/html etc
   * @type {Object}
   */
  mime: {
    type: String,
    default: MIME_TEXT,
    enum: [MIME_TEXT, MIME_HTML],
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
   * @name state
   * @description message state i.e Received, Sent, Queued etc
   * @type {Object}
   */
  state: {
    type: String,
    default: STATE_UNKNOWN,
    enum: [
      STATE_RECEIVED, STATE_UNKNOWN,
      STATE_SENT, STATE_QUEUED,
      STATE_DELIVERED
    ],
    index: true
  },


  /**
   * @name mode
   * @description message transport send mode i.e Pull or Push etc
   * @type {Object}
   */
  mode: {
    type: String,
    default: SEND_MODE_PUSH,
    enum: [
      SEND_MODE_PUSH, SEND_MODE_PULL
    ],
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
   * @name subject
   * @description subject of the message
   * i.e email title etc
   * e.g Hello
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  subject: {
    type: String
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
  },


  /**
   * @name options
   * @description additional message sending options
   * i.e push sending options, email sending options etc
   * @since 0.1.0
   * @type {Object}
   * @private
   */
  options: {
    type: Mixed
  },


  /**
   * @name hash
   * @description unique message hash that is set by a transport
   * 
   *              It allow for a transport to uniquely identify a message.
   *
   *              A quick scenarion is when sms is received and you dont want
   *              to receive a message previous received from a transport.
   *              
   *              You can use transport hash to check for sms existance or 
   *              upserting a message.
   *              
   * @since 0.3.0
   * @type {Object}
   */
  hash: {
    type: String,
    unique: true,
    required: true,
    trim: true
  }

}, {
  timestamps: true
});


//TODO add delivery date


//-----------------------------------------------------------------------------
// hooks
//-----------------------------------------------------------------------------

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

  //ensure message hash if not set by a transport
  if (!this.hash || _.isEmpty(this.hash)) {
    const _hash = _.pick(this, HASH_FIELDS);
    this.hash = hash(_hash);
  }

  //set mime type
  if (!this.mime && isHtml(this.body)) {
    this.mime = MIME_HTML;
  } else {
    this.mime = MIME_TEXT;
  }

  next();

});


//-----------------------------------------------------------------------------
// instance properties & methods
//-----------------------------------------------------------------------------

/**
 * @name _send
 * @description send this message using actual transport
 * @param  {Function} done a callback to invoke on success or failure
 * @return {Message|Error} an instance of message or error
 * @type {Function}
 * @since 0.1.0
 * @private
 */
MessageSchema.methods._send = function (done) {

  //this refer to Message instance context

  try {
    //obtain message transport
    const transport = require(this.transport);

    //obtain transport queue
    //to be used to notify on success sent or failure
    const queue = transport._queue;

    //TODO notify message queue for success send

    //NOTE! poll transport should return state on the result
    //cause they will later pick messages for sending

    async.waterfall([

      function send(next) {

        //this refer to Message instance context

        transport.send(this, function (error, result) {

          //this refer to Message instance context

          //update last send fail details
          if (error) {
            this.failedAt = new Date();

            //obtain error details
            if (error instanceof Error) {
              error = {
                code: error.code,
                message: error.message,
                status: error.status
              };
            }

            //notify send error
            //TODO make use of redis message bus
            if (queue) {
              queue.emit('message:sent:error', error);
            }

            this.result = error;
          }

          //update success details
          else {
            this.sentAt = new Date();
            this.state = _.get(result, 'state', STATE_DELIVERED);
            this.result = result;

          }

          next(null, this);

        }.bind(this));

      }.bind(this),

      function update(message, next) {
        message.save(function (error, _message) {
          if (!error && queue) {
            //notify send success
            //TODO make use of redis message bus
            queue.emit('message:sent:success', _message);
          }
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
 * @description send this message using actual transport or 
 *              log it on console
 * @param {Object} [options] valid send options
 * @param {Boolean} [options.fake] send fake message
 * @param  {Function} done a callback to invoke on success or failure
 * @return {Message|Error} an instance of message or error
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
 * @param  {Number}  [options.attempts] number of retries
 * @param  {Number}  [options.backoff] backoff strategy
 * @events message:queue:error, message:queue:success
 * @fire {Message|Error} an instance of queued message or error
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

  //ensure state to be unknown for poll transport
  if (this.mode === SEND_MODE_PULL) {
    this.state = STATE_UNKNOWN;
  }

  //persist message
  this.save(function (error, message) {

    //notify error
    if (error) {
      Message._queue.emit('message:queue:error', error);
    }

    //notify message queued successfully
    //since a poll transport will later pull for the message to send
    else if (message.mode === SEND_MODE_PULL) {
      Message._queue.emit('message:queue:success', message);
    }

    //queue message for later send
    //push transport are notified in their worker to send the message
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

      //ensure message has been queued
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


//-----------------------------------------------------------------------------
// static properties & methods
//-----------------------------------------------------------------------------

/**
 * message directions
 */
MessageSchema.statics.DIRECTION_INBOUND = DIRECTION_INBOUND;
MessageSchema.statics.DIRECTION_OUTBOUND = DIRECTION_OUTBOUND;
MessageSchema.statics.DIRECTIONS = [
  DIRECTION_OUTBOUND,
  DIRECTION_OUTBOUND
];

/**
 * message types
 */
MessageSchema.statics.TYPE_SMS = TYPE_SMS;
MessageSchema.statics.TYPE_EMAIL = TYPE_EMAIL;
MessageSchema.statics.TYPE_PUSH = TYPE_PUSH;
MessageSchema.statics.TYPES = [
  TYPE_SMS, TYPE_EMAIL, TYPE_PUSH
];


/**
 * message mime types
 */
MessageSchema.statics.MIME_TEXT = MIME_TEXT;
MessageSchema.statics.MIME_HTML = MIME_HTML;
MessageSchema.statics.MIMES = [
  MIME_TEXT, MIME_HTML
];


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
 * transaport sending mode
 */
MessageSchema.statics.SEND_MODE_PULL = SEND_MODE_PULL;
MessageSchema.statics.SEND_MODE_PUSH = SEND_MODE_PUSH;
MessageSchema.statics.SEND_MODES = [
  SEND_MODE_PUSH,
  SEND_MODE_PULL
];


/**
 * message stateS
 */
MessageSchema.statics.STATE_RECEIVED = STATE_RECEIVED;
MessageSchema.statics.STATE_UNKNOWN = STATE_UNKNOWN;
MessageSchema.statics.STATE_SENT = STATE_SENT;
MessageSchema.statics.STATE_QUEUED = STATE_QUEUED;
MessageSchema.statics.STATE_DELIVERED = STATE_DELIVERED;
MessageSchema.statics.STATES = [
  STATE_RECEIVED, STATE_UNKNOWN,
  STATE_SENT, STATE_QUEUED,
  STATE_DELIVERED
];


/**
 * @name unsent
 * @description obtain unsent message(s)
 * @param {Object} [criteria] valid mongoose query criteria
 * @param  {Function} done a callback to invoke on success or failure
 * @type {Function}
 * @return {Array[Message]} collection of unsent messages
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
    sentAt: { $ne: null } //ensure message have been sent
  }, criteria);

  //find sent message
  this.find(criteria, done);

};


/**
 * @name resend
 * @description re-send all failed message(s) based on specified criteria
 * @param {Object} [criteria] valid mongoose query criteria
 * @param  {Function} done a callback to invoke on success or failure
 * @type {Function}
 * @return {Array[Message]} collection of resend message(s)
 * @since 0.1.0
 * @public
 * @example
 *
 * Message.resend(fuction(error, sents){
 *     ...
 *     //process error
 *     //process sents
 *     ...
 * });
 *
 * or specify additional criteria
 *
 * Message.resend(criteria, function(error, sents){
 *     ...
 *     //process error
 *     //process sents
 *     ...
 * });
 * 
 */
MessageSchema.statics.resend = function resend(criteria, done) {

  //this refer to Message static context

  //normalize arguments
  if (criteria && _.isFunction(criteria)) {
    done = criteria;
    criteria = {};
  }

  //reference Message
  const Message = this;

  //resend fail or unsent message(s)
  async.waterfall([

    function findUnsentMessages(next) {
      Message.unsent(criteria, next);
    },

    function resendMessages(unsents, next) {

      //check for unsent message(s)
      if (unsents) {

        //prepare send work
        //TODO make use of multi process possibly paralleljs
        unsents = _.map(unsents, function (unsent) {
          return function (_next) {
            unsent.send(_next);
          };
        });

        async.parallel(_.compact(unsents), next);

      } else {
        next(null, unsents);
      }

    }

  ], done);

};


/**
 * @name requeue
 * @description requeue all failed message(s) based on specified criteria
 * @param {Object} [criteria] valid mongoose query criteria
 * @type {Function}
 * @events message:requeue:error, message:requeue:success, 
 *         message:queue:error, message:queue:success
 * @fire {Array[Message]|Error} collection of requeued messages or error
 * @since 0.1.0 
 * @public
 * @example
 * 
 * //requeue without criteria
 * Message.requeue();
 *
 * //requeue with criteria
 * Message.requeue(criteria);
 * 
 */
MessageSchema.statics.requeue = function (criteria) {

  //this refer to Message static context

  //merge criteria
  criteria = _.merge({}, criteria);

  //reference Message
  const Message = this;

  //find all unsent message(s) for requeue
  Message.unsent(criteria, function (error, unsents) {

    //fire requeue error
    if (error) {
      Message._queue.emit('message:requeue:error', error);
    }

    //re-queue all unsent message(s)
    else {
      //fire requeue success
      Message._queue.emit('message:requeue:success', unsents);

      //re-queue unsent message
      _.forEach(unsents, function (unsent) {
        unsent.queue();
      });
    }

  });

};


/**
 * @name process
 * @description used by worker process to process message and send them
 * @param  {Job}   job  valid instance of kue job
 * @param  {Function} done a callback to invoke on success send or failure
 * @return {Object}        message result or error
 * @since 0.2.0
 * @public
 */
MessageSchema.statics.process = function (job, done) {

  //reference Message
  const Message = mongoose.model('Message');

  async.waterfall([

    function findMessageById(next) {
      Message.findById(job.data._id, next);
    },

    function sendMessage(message, next) {

      //send message if exists
      if (message) {
        message.send(next);
      }

      //do nothing and continue
      else {
        next();
      }

    }

  ], done);

};


/**
 * export message schema
 * @type {mongoose.Schema}
 */
exports = module.exports = MessageSchema;
