'use strict';

//dependencies
const path = require('path');
const expect = require('chai').expect;
const mongoose = require('mongoose');
const faker = require('faker');
const echoTransport = path.join(__dirname, '..', 'fake', 'echo');
const Message = require(path.join(__dirname, '..', '..'))();

describe('open311-messages', function () {

  it('should be a function', function () {
    expect(Message).to.not.be.null;
    expect(Message).to.be.a('function');
  });

  it('should be singleton', function () {
    const Message2 = require(path.join(__dirname, '..', '..'))();
    expect(Message._uuid).to.be.equal(Message2._uuid);
  });

  it('should be able to register mongoose model', function () {
    const model = mongoose.model('Message');
    expect(model).to.not.be.null;
    expect(model.modelName).to.be.equal('Message');
  });

  describe('schema', function () {

    it('should have type property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.type).to.exist;

      const type = schema.type;
      expect(type.index).to.be.true;
      expect(type.default).to.be.equal(Message.TYPE_EMAIL);
      expect(type.type).to.be.eql(String);
    });

    it('should have direction property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.direction).to.exist;

      const direction = schema.direction;
      expect(direction.index).to.be.true;
      expect(direction.default).to.be.equal(Message.DIRECTION_OUTBOUND);
      expect(direction.type).to.be.eql(String);
    });

    it('should have from property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.from).to.exist;

      const from = schema.from;
      expect(from.index).to.be.true;
      expect(from.required).to.be.true;
      expect(from.type).to.be.eql(String);
    });

    it('should have to property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.to).to.exist;

      const to = schema.to;
      expect(to.index).to.be.true;
      expect(to.required).to.be.true;
      expect(to.type).to.be.an('array');
    });

    it('should have cc property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.cc).to.exist;

      const cc = schema.cc;
      expect(cc.index).to.be.true;
      expect(cc.type).to.be.an('array');
    });

    it('should have bcc property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.bcc).to.exist;

      const bcc = schema.bcc;
      expect(bcc.index).to.be.true;
      expect(bcc.type).to.be.an('array');
    });

    it('should have body property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.body).to.exist;

      const body = schema.body;
      expect(body.required).to.be.true;
      expect(body.type).to.be.eql(String);
    });

    it('should have sentAt property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.sentAt).to.exist;

      const sentAt = schema.sentAt;
      expect(sentAt.index).to.be.true;
      expect(sentAt.type).to.be.eql(Date);
    });

    it('should have result property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.result).to.exist;
    });

  });

  describe('message instance', function () {

    it('should be able to send fake message', function (done) {
      const details = {
        from: faker.internet.email(),
        to: faker.internet.email(),
        body: faker.lorem.sentence()
      };
      const message = new Message(details);

      message.send({ fake: true }, function (error, sent) {
        expect(error).to.not.exist;
        expect(sent).to.exist;

        expect(sent._id).to.exist;
        expect(sent.sentAt).to.exist;
        expect(sent.body).to.exist;
        expect(sent.body).to.be.equal(details.body);
        expect(sent.from).to.exist;
        expect(sent.from).to.be.equal(details.from);

        expect(sent.queue).to.be.equal(Message.TYPE_EMAIL.toLowerCase());

        done(error, sent);
      });

    });

    it('should be able to send message using actual transport',
      function (done) {
        const details = {
          from: faker.internet.email(),
          to: faker.internet.email(),
          body: faker.lorem.sentence(),
          transport: echoTransport
        };
        const message = new Message(details);

        message.send(function (error, sent) {
          expect(error).to.not.exist;
          expect(sent).to.exist;

          expect(sent._id).to.exist;
          expect(sent.sentAt).to.exist;
          expect(sent.body).to.exist;
          expect(sent.body).to.be.equal(details.body);
          expect(sent.from).to.exist;
          expect(sent.from).to.be.equal(details.from);

          expect(sent.queue).to.be.equal(Message.TYPE_EMAIL.toLowerCase());

          done(error, sent);
        });

      });

  });

});