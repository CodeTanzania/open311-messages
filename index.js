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
const Message = require(path.join(__dirname, 'lib', 'message'));

module.exports = function () {
  //TODO add initialization logics
  return Message;
};