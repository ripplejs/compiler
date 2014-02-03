var walk = require('dom-walk');
var attributes = require('attributes');
var emitter = require('emitter');
var Observer = require('observer');
var View = require('view');

/**
 * The compiler will take a set of views, an element and
 * a scope and process each node going down the tree. Whenever
 * it finds a node matching a directive it will process it.
 *
 * @param {Object} views Element bindings
 * @param {Object} bindings Attribute bindings
 */
function Compiler(views, bindings) {
  this.views = views || {};
  this.bindings = bindings || {};
}

/**
 * Mixin emitter
 */
emitter(Compiler.prototype);

/**
 * For plugins
 *
 * @param {Function} fn
 *
 * @return {Compiler}
 */
Compiler.prototype.use = function(fn) {
  fn(this);
  return this;
};

/**
 * Compile a node with a given scope, traversing down
 * the tree and applying all the views.
 *
 * @param {Element} node
 * @param {Scope} scope
 *
 * @api public
 * @return {Element}
 */
Compiler.prototype.compile = function(node, scope){
  this.scope = scope;
  this.view = new View(node, scope);
  walk(node, this.compileNode.bind(this));
  return this.view;
};

/**
 * Compile a single node
 *
 * @param {Scope} scope
 * @param {Element} el
 * @param {Function} next
 *
 * @api private
 * @return {void}
 */
Compiler.prototype.compileNode = function(el, next) {
  // Text nodes don't do anything, but this gives plugins
  // a chance to hook in an do something.
  if(el.nodeType === 3) {
    this.emit('text', this.scope, el);
    return next();
  }

  this.emit('node', this.scope, el, next);

  // Check to see if this element is a custom view
  var view = this.getView(el);

  // This node is a custom view
  if(view) {
    this.compileViews(el, view);
    return next();
  }

  // It's a normal element, so just process the bindings
  this.compileBindings(el, next);
};

/**
 * Get the directive for an element if it exists
 *
 * @param {Element} el
 *
 * @return {Function} Returns undefined if it isn't a directive
 */
Compiler.prototype.getView = function(el) {
  return this.views[el.nodeName.toLowerCase()];
};

/**
 * Compile the directive for this element if it exists.
 *
 * @param {Observer} scope
 * @param {Element} el
 * @param {Function} next
 *
 * @return {void}
 */
Compiler.prototype.compileViews = function(el, View, next) {
  var scope = this.scope;
  var props = this.getProperties(el);
  var view = new View(el, state);
  this.bindProperties(view, scope, props);
  this.bindEvents(view, scope, el);
  this.view.children.push(view);
  this.emit('view', el, view, props, this);
};

/**
 * Get the properties from an element to pass to the
 * child directive.
 *
 * @param {Element} el
 *
 * @return {Object}
 */
Compiler.prototype.getProperties = function(el) {
  return el.dataset;
};

/**
 * Bind properties from one scope to another
 *
 * @param {Observer} scope
 * @param {Observer} properties
 * @param {Object} props
 *
 * @return {void}
 */
Compiler.prototype.bindProperties = function(view, scope, props){
  Object.keys(props).forEach(function(name){
    var scopeKey = props[name];
    scope.change(scopeKey, function(val){
      view.set(name, val);
    })
  });
};

/**
 * Bind events from a child directive to the parent
 * view. Events are emitted from the child directive
 *
 * @param {Object} view
 * @param {Observer} scope
 * @param {Element} el
 *
 * @return {void}
 */
Compiler.prototype.bindEvents = function(view, el) {
  if(!view.emit) return; // Not an emitter
  var self = this;
  var scope = this.scope;
  var events = el.getAttribute('events');
  var fn = new Function("return " + events);
  var mapping = fn.call(scope);
  Object.keys(mapping).forEach(function(name){
    var callback = mapping[name];
    view.on(name, callback.bind(self));
  });
};

/**
 * Compile bindings on elements and bind them
 * to the current scope
 *
 * @param {Observer} scope
 * @param {Element} el
 *
 * @return {void}
 */
Compiler.prototype.compileBindings = function(el, next) {
  var scope = this.scope;
  var attrs = attributes(el);
  for(var attr in attrs) {
    var value = attrs[attr];
    var obj = this.bindings[attr];
    if(!obj) continue;
    var process = obj.process;
    var options = obj.options;
    var attributeValue = el.getAttribute(obj.name);
    var binding = process.call(this, el, attr, value);

    if(binding.skip === true) {
      // skip children
    }

    if(!binding.unbind) {
      throw new Error('Binding');
    }
    // Options might 1. prevent other bindings, 2. skip processing children
    this.view.bindings.push(binding);
    this.emit('binding', scope, el, binding, obj);
  }
};

/**
 * Exports
 *
 * @type {Function}
 */
module.exports = Compiler;