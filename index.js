var walk = require('dom-walk');
var attributes = require('attributes');
var emitter = require('emitter');
var find = require('find');
var Component = require('component');
var Attribute = require('attribute');


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
Compiler.prototype.addComponent = function(matches, View) {
  this.components.push({
    matches: matches,
    view: View
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
Compiler.prototype.addAttribute = function(matches, process) {
  this.attributes.push({
    matches: matches,
    process: process
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
  return find(bindings, function(binding){
    if(name === binding.matches) {
      return binding;
    }
    if(binding.matches.test(name)) {
      return binding;
    }
  });
};


/**
 * Compile a node with a given scope, traversing down
 * the tree and applying all the views.
 *
 * @param {View} view
 *
 * @return {Object}
 */
Compiler.prototype.compile = function(view){

  // Attach the view to a fragment for speedy parsing
  var fragment = document.createDocumentFragment();
  fragment.appendChild(view.el);

  // Store references to the bindings so
  // that we can dispose of them later
  var attributeBindings = [];
  var componentBindings = [];

  walk(view.el, function(node, next){

    // Render text nodes. Interpolate the text node using the
    // views interpolate method. Whenever the view model changes
    // it will re-render the text node.
    if(node.nodeType === 3) {
      view.interpolate(node.data, function(val){
        node.data = val;
      });
      return next();
    }

    // Render components. We'll create a view for this component
    // and bind to any data or events. Then we'll replace the
    // placeholder node in the template with the rendered view
    var component = this.getComponentBinding(node);
    if(component) {
      componentBindings.push(new Component(view, node, component));
      return next();
    }

    // Render attributes. If any of the attributes on the node
    // match one of our bindings we'll run the binding on the node.
    // Otherwise we'll interpolate the attribute which will update
    // whenever the view model changes.
    var attrs = attributes(node);

    Object.keys(attrs).forEach(function(attr){
      var binding = this.getAttributeBinding(attr);
      if(!binding) {
        view.interpolate(attrs[attr], function(val){
          node.setAttribute(attr, val);
        });
        return next();
      }
      attributeBindings.push(new Attribute(this, view, node, attr));
    }, this);

    next();
  }.bind(this));

  // trigger all bindings
  view.emit('bind');

  return view;
};


/**
 * Exports
 *
 * @type {Function}
 */
module.exports = Compiler;
