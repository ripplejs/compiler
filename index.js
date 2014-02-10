var walk = require('dom-walk');
var attributes = require('attributes');
var emitter = require('emitter');
var find = require('find');
var isBoolean = require('is-boolean-attribute');


/**
 * The compiler will take a set of views, an element and
 * a scope and process each node going down the tree. Whenever
 * it finds a node matching a directive it will process it.
 */
function Compiler() {
  this.components = [];
  this.attributes = [];
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
 * Add a component binding. This will be rendered as a separate
 * view and have it's own scope.
 *
 * @param {String|Regex} matches String or regex to match an element name
 * @param {Function} View
 * @param {Object} options
 */
Compiler.prototype.addComponent = function(matches, fn) {
  this.components.push({
    matches: matches,
    fn: fn
  });
};


/**
 * Add an attribute binding. Whenever this attribute is matched
 * in the DOM the function will be code with the current view
 * and the element.
 *
 * @param {String|Regex} matches String or regex to match an attribute name
 * @param {Function} process
 * @param {Object} options
 */
Compiler.prototype.addAttribute = function(matches, fn) {
  this.attributes.push({
    matches: matches,
    fn: fn
  });
};


/**
 * Check if there's a component for this element
 *
 * @param {Element} el
 *
 * @return {Mixed}
 */
Compiler.prototype.getComponentBinding = function(el) {
  return this.getBinding(el.nodeName.toLowerCase(), this.components);
};


/**
 * Get the attribute binding for an attribute
 *
 * @param {String} attr
 *
 * @return {Mixed}
 */
Compiler.prototype.getAttributeBinding = function(attr) {
  return this.getBinding(attr, this.attributes);
};


/**
 * Get the attribute binding for an attribute
 *
 * @param {String} attr
 *
 * @return {Mixed}
 */
Compiler.prototype.getBinding = function(name, bindings) {
  var matched = find(bindings, function(binding){
    if(typeof binding.matches === 'string') {
      if(name === binding.matches) return binding;
      return;
    }
    if(binding.matches.test(name)){
      return binding;
    }
  });
  if(!matched) return undefined;
  return matched.fn;
};


/**
 * Compile a node with a given scope, traversing down
 * the tree and applying all the views.
 *
 * @param {View} view
 *
 * @return {View}
 */
Compiler.prototype.compile = function(view){
  var self = this;
  attachToFragment(view);
  walk(view.el, function(node, next){
    if(node.nodeType === 3) {
      processText(view, node);
    }
    else if(node.nodeType === 1) {
      processNode(self, view, node);
    }
    next();
  });
  view.bind();
  return view;
};


/**
 * Attach the view to a DocumentFragment
 *
 * @param {View} view
 *
 * @return {DocumentFragment}
 */
function attachToFragment(view) {
  var fragment = document.createDocumentFragment();
  fragment.appendChild(view.el);
}


/**
 * Process a text node. Interpolate the text node
 * using the view if possible.
 *
 * @param {View} view
 * @param {Element} node
 *
 * @return {void}
 */
function processText(view, node) {
  var text = node.data;
  view.on('bind', function(){
    var removeBinding = view.interpolate(text, function(val){
      node.data = val;
    });
    view.once('unbind', removeBinding);
  });
}


/**
 * Process a single node on the view. If there is a Component
 * for this element, we'll create that view and replace the
 * placeholder element with that component.
 *
 * @param {View} view
 * @param {Element} node
 *
 * @return {boolean}
 */
function processNode(compiler, view, node) {
  var Component = compiler.getComponentBinding(node);

  if(!Component) {
    return processAttributes(compiler, view, node);
  }

  view.on('bind', function(){
    var component = new Component();
    // node.parentElement.replaceChild(node, component.el);
    view.once('unbind', function(){
      component.unbind();
    });
  });
}


/**
 * Process the attributes on a node. If there is a binding for
 * an attribute it will run it, otherwise it will try to
 * interpolate the attributes value using the view
 *
 * @param {View} view
 * @param {Element} node
 *
 * @return {void}
 */
function processAttributes(compiler, view, node) {
  var attrs = attributes(node);

  function process(attr){
    var binding = compiler.getAttributeBinding(attr);

    if(binding) {
      binding.call(compiler, view, node, attr, attrs[attr]);
    }
    else {
      interpolateAttribute(view, node, attr, attrs);
    }
  }

  Object.keys(attrs).forEach(process);
}


/**
 * Interpolate an attribute on a node using the view
 *
 * @param {View} view
 * @param {Element} node
 * @param {String} attr
 *
 * @api private
 * @return {void}
 */
function interpolateAttribute(view, node, attr) {
  var attrs = attributes(node);

  view.on('bind', function(){
    var removeBinding = view.interpolate(attrs[attr], function(val){
      if(isBoolean(attr) && !val) {
        node.removeAttribute(attr);
      }
      else {
        node.setAttribute(attr, val);
      }
    });
    view.once('unbind', removeBinding);
  });
}


/**
 * Exports
 *
 * @type {Function}
 */
module.exports = Compiler;
