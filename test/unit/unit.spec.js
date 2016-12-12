'use strict';

//dependencies
const path = require('path');
const expect = require('chai').expect;
const Message = require(path.join(__dirname, '..', '..'));

describe('open311-messages', function () {

  it('should be a function', function () {
    expect(Message).to.not.be.null;
    expect(Message).to.be.a('function');
  });

});