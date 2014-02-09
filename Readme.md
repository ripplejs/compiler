
# Compiler

[![Build Status](https://travis-ci.org/ripplejs/compiler.png?branch=master)](https://travis-ci.org/ripplejs/compiler)

  Compile a view using a set of directives and bindings.

## Installation

  Install with [component(1)](http://component.io):

    $ component install ripplesjs/compiler

## API

```js
// Create a new compiler using a set of directives and bindings
var compiler = new Compiler(views, bindings);

// The compile the element into a Component instance
var view = compiler.compile(el, {
  data: 'to pass to the view for binding',
  open: true
});
```

## Views

Views are custom elements that can be re-used and have their own views
and compilers that are mounted into the current component being compiled.

The views passed in must look like this:

```js
function CommentBox(el, state) {
  this.el = el;
  this.state = state;
}

var views = {
  'commentbox': CommentBox
};
```

The constructor is passed the element that is associated with it and an `Observer`
for state that is solely for this view.

## Bindings

  Bindings are attributes that can create one or two-way bindings with an element
  using the properties passed to the compile method.

  Bindings are an object that look like this:

```js
var bindings = {
  'data-text': function(el, value, scope) {
    return scope.change(value, function(newValue){
      el.textContent = newValue;
    });
  }
};
```

  Bindings are passed the element that contains the attribute, the scope which is
  an `Observer` and the value of the attribute.

  They should return a function for removing the binding.

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