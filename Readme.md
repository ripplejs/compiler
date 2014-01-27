
# Compiler

  Compile a DOM node using a set of directives and bindings.

## Installation

  Install with [component(1)](http://component.io):

    $ component install ripplesjs/compile

## API

```js
// Create a new compiler using a set of directives and bindings
var compiler = new Compiler(directives, bindings);

// The compile the element into a Component instance
var component = compiler.compile(el, {
  data: 'to pass to the view for binding',
  open: true
});
```

## Directives

Directives are custom elements that can be re-used and have their own views
and compilers that are mounted into the current component being compiled.

The directives passed in must look like this:

```js
function CommentBox(el, state, props) {
  this.el = el;
}

var directives = {
  'commentbox': CommentBox
};
```

The constructor is passed the element that is associated with it, an `Observer`
for state that is solely for this view and a props `Observer` that is immutable
properties passed down from the parent directive.

If there is no parent directive (it is the root) the props will be an `Observer`
of the object that was originally passed into the `compile` method.

## Bindings

  Bindings are attributes that can create one or two-way bindings with an element
  using the properties passed to the compile method.

  Bindings are an object that look like this:

```js
function text(el, scope, value) {
  scope.change(value, function(newValue){
    el.textContent = newValue;
  })
}

var bindings = {
  'data-text': text
};
```

  Bindings are passed the element that contains the attribute, the scope which is
  an `Observer` and the value of the attribute.

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