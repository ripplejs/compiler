
# Compiler

[![Build Status](https://travis-ci.org/ripplejs/compiler.png?branch=master)](https://travis-ci.org/ripplejs/compiler)

  Render a template and view using a set of directives and bindings. Walks through the DOM and binds any custom attributes or elements.

  * Compose views
  * Add custom attributes
  * Toggles boolean attributes automatically eg. hidden="{{hidden}}"

## Installation

  Install with [component(1)](http://component.io):

    $ component install ripplesjs/compiler

## API

```js
var compiler = new Compiler();

// Add attributes
compiler.directive('data-text', function(view, node, attr, value){

});

// Add components
compiler.component('clock', ClockView);

// Then render a template using a view
var el = compiler.render('<clock time="{{now}}" />', view);
```

## License

  The MIT License (MIT)

  Copyright (c) 2014 <copyright holders>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.