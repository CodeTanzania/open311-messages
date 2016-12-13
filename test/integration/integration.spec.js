'use strict';

//dependencies
const path = require('path');
const async = require('async');
const kue = require('kue');
const expect = require('chai').expect;
const faker = require('faker');
const Message = require(path.join(__dirname, '..', '..'))();
const echoTransport = require(path.join(__dirname, '..', 'fake', 'echo'));

describe('transport', function () {

  it('should be able to process queued message', function (done) {
    const details = {
      from: faker.internet.email(),
      to: faker.internet.email(),
      body: faker.lorem.sentence()
    };

    echoTransport._queue.on('job enqueue', function (id, type) {
      expect(id).to.exist;
      expect(type).to.exist;
      expect(type).to.be.equal(echoTransport.queueName);
    }).on('job complete', function (id /*, result*/ ) {
      async.waterfall([
        function getJob(next) {
          kue.Job.get(id, next);
        },
        function getMessage(job, next) {
          Message.findById(job.data._id, next);
        },
        function assertMessage(message, next) {

          expect(message).to.exist;

          expect(message._id).to.exist;
          expect(message.sentAt).to.exist;
          expect(message.failedAt).to.not.exist;
          expect(message.body).to.exist;
          expect(message.body).to.be.equal(details.body);
          expect(message.from).to.exist;
          expect(message.from).to.be.equal(details.from);

          expect(message.direction).to.be.equal(Message.DIRECTION_OUTBOUND);
          expect(message.priority).to.be.equal(Message.PRIORITY_NORMAL);
          expect(message.queueName)
            .to.be.equal(echoTransport.queueName);

          expect(message.result).to.exist;
          expect(message.result.message).to.be.equal('success');

          next(null, message);
        }
      ], done);
    });

    const message = new Message(details);

    echoTransport.queue(message);

  });

});