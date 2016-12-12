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
   * if message send failed just set the result and not update sent time
   * @since 0.1.0
   * @type {Object}
   */
  sentAt: {
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

  next();

});


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
 * export message schema
 * @type {mongoose.Schema}
 */
exports = module.exports = MessageSchema;