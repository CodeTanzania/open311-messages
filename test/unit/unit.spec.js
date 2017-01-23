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

    it('should have state property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.state).to.exist;

      const state = schema.state;
      expect(state.index).to.be.true;
      expect(state.default).to.be.equal(Message.STATE_UNKNOWN);
      expect(state.type).to.be.eql(String);
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

    it('should have subject property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.subject).to.exist;

      const subject = schema.subject;
      expect(subject.type).to.be.eql(String);
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

    it('should have options property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.options).to.exist;
    });

    it('should have hash property', function () {
      const model = mongoose.model('Message');
      const schema = model.schema.obj;

      expect(schema.hash).to.exist;

      const hash = schema.hash;
      expect(hash.type).to.be.eql(String);
    });

  });

  describe('message#send', function () {

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

        expect(sent.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
        expect(sent.priority).to.be.equal(Message.PRIORITY_NORMAL);
        expect(sent.queueName).to.be.equal(Message.TYPE_EMAIL.toLowerCase());

        expect(sent.hash).to.exist;

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

          expect(sent.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
          expect(sent.priority).to.be.equal(Message.PRIORITY_NORMAL);
          expect(sent.queueName).to.be.equal(Message.TYPE_EMAIL.toLowerCase());

          done(error, sent);
        });

      });

  });

  describe('message#queue', function () {

    it('should be able to queue message for later send', function (done) {

      const details = {
        from: faker.internet.email(),
        to: faker.internet.email(),
        body: faker.lorem.sentence(),
        transport: echoTransport
      };

      Message._queue.on('message:queue:error', function (error) {
        done(error);
      });

      Message._queue.on('message:queue:success', function (message) {
        expect(message).to.exist;

        expect(message._id).to.exist;
        expect(message.sentAt).to.not.exist;
        expect(message.body).to.exist;
        expect(message.body).to.be.equal(details.body);
        expect(message.from).to.exist;
        expect(message.from).to.be.equal(details.from);

        expect(message.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
        expect(message.priority).to.be.equal(Message.PRIORITY_NORMAL);
        expect(message.queueName)
          .to.be.equal(Message.TYPE_EMAIL.toLowerCase());

        done(null, message);
      });

      const message = new Message(details);

      message.queue();

    });

  });

  describe('Message#resend', function () {

    const details = {
      from: faker.internet.email(),
      to: faker.internet.email(),
      body: faker.lorem.sentence(),
      transport: echoTransport
    };

    before(function (done) {
      Message.create(details, done);
    });

    it('should be able to resend unsent message(s)', function (done) {

      Message.resend(function (error, messages) {
        expect(error).to.not.exist;
        expect(messages).to.exist;
        expect(messages).to.have.length(1);

        const message = messages[0];

        expect(message._id).to.exist;
        expect(message.sentAt).to.exist;
        expect(message.body).to.exist;
        expect(message.body).to.be.equal(details.body);
        expect(message.from).to.exist;
        expect(message.from).to.be.equal(details.from);

        expect(message.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
        expect(message.priority).to.be.equal(Message.PRIORITY_NORMAL);
        expect(message.queueName)
          .to.be.equal(Message.TYPE_EMAIL.toLowerCase());

        done(error, messages);
      });

    });

  });

  describe('Message#unsent', function () {

    const details = {
      from: faker.internet.email(),
      to: faker.internet.email(),
      body: faker.lorem.sentence(),
      transport: echoTransport
    };

    before(function (done) {
      Message.create(details, done);
    });

    it('should be able to find unsent messages', function (done) {
      Message.unsent(function (error, messages) {
        expect(error).to.not.exist;
        expect(messages).to.exist;
        expect(messages).to.have.length(1);

        const message = messages[0];

        expect(message._id).to.exist;
        expect(message.sentAt).to.not.exist;
        expect(message.body).to.exist;
        expect(message.body).to.be.equal(details.body);
        expect(message.from).to.exist;
        expect(message.from).to.be.equal(details.from);

        expect(message.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
        expect(message.priority).to.be.equal(Message.PRIORITY_NORMAL);
        expect(message.queueName)
          .to.be.equal(Message.TYPE_EMAIL.toLowerCase());

        done(error, messages);
      });
    });

  });


  describe('Message#sent', function () {

    const details = {
      from: faker.internet.email(),
      to: faker.internet.email(),
      body: faker.lorem.sentence()
    };

    before(function (done) {
      const message = new Message(details);
      message.send({ fake: true }, done);
    });

    it('should be able to find sent messages', function (done) {
      Message.sent(function (error, messages) {
        expect(error).to.not.exist;
        expect(messages).to.exist;
        expect(messages).to.have.length(1);

        const message = messages[0];

        expect(message._id).to.exist;
        expect(message.sentAt).to.exist;
        expect(message.body).to.exist;
        expect(message.body).to.be.equal(details.body);
        expect(message.from).to.exist;
        expect(message.from).to.be.equal(details.from);

        expect(message.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
        expect(message.priority).to.be.equal(Message.PRIORITY_NORMAL);
        expect(message.queueName)
          .to.be.equal(Message.TYPE_EMAIL.toLowerCase());

        done(error, messages);
      });
    });

  });

  afterEach(function (done) {
    Message.remove(done);
  });

});
