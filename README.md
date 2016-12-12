open311-messages
================

[![Build Status](https://travis-ci.org/CodeTanzania/open311-messages.svg?branch=master)](https://travis-ci.org/CodeTanzania/open311-messages)
[![Dependencies Status](https://david-dm.org/CodeTanzania/open311-messages/status.svg?style=flat-square)](https://david-dm.org/CodeTanzania/open311-messages)

open311 module to send notification messages i.e email, sms, push etc

## Requirements
- [MongoDB 3.2+](https://www.mongodb.com/)
- [NodeJS v6.9.2+](https://nodejs.org)
- [Redis 2.8 +](https://redis.io/)

## Usage
```sh
const mongoose = require('mongoose');
mongoose.connect(<url>);

...

const Message = require('Message');

...

``` 

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```

* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence
The MIT License (MIT)

Copyright (c) 2016 lykmapipo, CodeTanzania & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 