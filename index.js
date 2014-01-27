var walk = require('dom-walk');
var attributes = require('attributes');
var emitter = require('emitter');
var Observer = require('observer');
var Component = require('./lib/component');

/**
 * The compiler will take a set of directives, an element and
 * a scope and process each node going down the tree. Whenever
 * it finds a node matching a directive it will process it.
 *
 * @param {Object} directives Element bindings
 * @param {Object} bindings Attribute bindings
 */
function Compiler(directives, bindings) {
  this.directives = directives || {};
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
 * the tree and applying all the directives.
 *
 * @param {Element} node
 * @param {Scope} scope
 *
 * @api public
 * @return {Element}
 */
Compiler.prototype.compile = function(node, data){
  var self = this;
  this.children = [];
  var scope = new Observer(data);
  walk(node, function(el, next){
    self.compileNode(scope, el, next);
  });
  return new Component(node, this.children);
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
Compiler.prototype.compileNode = function(scope, el, next) {
  if(el.nodeType === 3) {
    this.emit('text', scope, el);
    return next();
  }
  this.emit('node', el, scope, next);
  var directive = this.getDirective(el);
  if(directive) {
    this.compileDirective(scope, el, directive, next);
  }
  else {
    this.compileBindings(scope, el, next);
  }
};

/**
 * Get the directive for an element if it exists
 *
 * @param {Element} el
 *
 * @return {Function} Returns undefined if it isn't a directive
 */
Compiler.prototype.getDirective = function(el) {
  return this.directives[el.nodeName.toLowerCase()];
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
Compiler.prototype.compileDirective = function(scope, el, directive, next) {
  var View = this.getDirective(el);
  if(!View) return;
  var props = this.getProperties(el);
  var state = new Observer();
  var view = new View(el, state);
  this.bindProperties(scope, state, props);
  this.bindEvents(view, scope, el);
  this.children.push(view);
  this.emit('directive', view, el);
  next();
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
Compiler.prototype.bindProperties = function(parent, child, props){
  Object.keys(props).forEach(function(name){
    var scopeKey = props[name];
    parent.change(scopeKey, function(val){
      child.set(name, val);
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
Compiler.prototype.bindEvents = function(view, scope, el) {
  if(!view.emit) return; // Not an emitter
  var events = el.getAttribute('events');
  var fn = new Function("return " + events);
  var mapping = fn.call(scope);
  Object.keys(mapping).forEach(function(name){
    var callback = mapping[name];
    view.on(name, callback.bind(scope));
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
Compiler.prototype.compileBindings = function(scope, el, next) {
  var attrs = attributes(el);
  for(var attr in attrs) {
    var value = attrs[attr];
    this.emit('attribute', scope, el, attr, value);
    var obj = this.bindings[attr];
    if(!obj) continue;
    var process = obj.process;
    var options = obj.options;
    var attributeValue = el.getAttribute(obj.name);
    var result = process.call(this, scope, el, this, next);
  }
};

/**
 * Exports
 *
 * @type {Function}
 */
module.exports = Compiler;