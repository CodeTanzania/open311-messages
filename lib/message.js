'use strict';


//dependencies
const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MessageSchema = new Schema({

}, { timestamps: true });


exports = module.exports = mongoose.model('Message', MessageSchema);