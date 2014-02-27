var walk = require('dom-walk');
var attributes = require('attributes');
var emitter = require('emitter');
var find = require('find');
var isBoolean = require('is-boolean-attribute');
var dom = require('fastdom');
var Interpolator = require('interpolate');
var domify = require('domify');


/**
 * Attach the view to a DocumentFragment
 *
 * @param {View} view
 *
 * @return {DocumentFragment}
 */
function attachToFragment(el) {
  var fragment = document.createDocumentFragment();
  fragment.appendChild(el);
  return fragment;
}


/**
 * The compiler will take a set of views, an element and
 * a scope and process each node going down the tree. Whenever
 * it finds a node matching a directive it will process it.
 */
function Compiler() {
  this.components = [];
  this.directives = [];
  this.interpolator = new Interpolator();
}


/**
 * Mixins
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
Compiler.prototype.component = function(matches, fn) {
  this.components.push({
    matches: matches,
    fn: fn
  });
  return this;
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
Compiler.prototype.directive = function(matches, fn) {
  this.directives.push({
    matches: matches,
    fn: fn
  });
  return this;
};


/**
 * Add an expression filter
 *
 * @param {String} name
 * @param {Function} fn
 */
Compiler.prototype.filter = function(name, fn) {
  this.interpolator.filter(name, fn);
  return this;
};


/**
 * Set the template delimiters
 *
 * @param {Regex} match
 *
 * @return {View}
 */
Compiler.prototype.delimiters = function(match) {
  this.interpolator.delimiters(match);
  return this;
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
  return this.getBinding(attr, this.directives);
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
 * Compile a template into an element and
 * bind it to this view
 *
 * @return {Element}
 */
Compiler.prototype.render = function(view, el) {
  var self = this;
  this.view = view;
  attachToFragment(el);
  walk(el, function(node, next){
    if(node.nodeType === 3) {
      self.processTextNode(node);
    }
    else if(node.nodeType === 1) {
      self.processNode(node);
    }
    next();
  });
  this.view = null;
  return el;
};


/**
 * Run an interpolation on the string using the state. Whenever
 * the model changes it will render the string again
 *
 * @param {String} str
 * @param {Function} callback
 *
 * @return {Function} a function to unbind the interpolation
 */
Compiler.prototype.interpolate = function(str, callback) {
  var self = this;
  var view = this.view;

  if( this.hasInterpolation(str) === false ) {
    return callback(str);
  }

  var attrs = this.interpolator.props(str);

  function render() {
    return self.interpolator.value(str, view.get(attrs));
  }

  callback(render());

  view.change(attrs, function(){
    callback(render());
  });
};


/**
 * Check if a string has expressions
 *
 * @param {String} str
 *
 * @return {Boolean}
 */
Compiler.prototype.hasInterpolation = function(str) {
  return this.interpolator.has(str);
};


/**
 * Process a text node. Interpolate the text node
 * using the view if possible.
 *
 * @param {View} view
 * @param {Element} node
 *
 * @return {void}
 */
Compiler.prototype.processTextNode = function(node) {
  this.interpolate(node.data, function(val){
    dom.write(function(){
      node.data = val;
    });
  });
};


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
Compiler.prototype.processNode = function(node) {
  var view = this.view;

  var Component = this.getComponentBinding(node);

  if(!Component) {
    return this.processAttributes(node);
  }

  var component = Component.create({
    owner: view,
    template: (node.innerHTML !== "") ? node.innerHTML : null
  });

  for (var i = node.attributes.length - 1; i >= 0; i--) {
    var attr = node.attributes[i];

    // Bind events
    if(attr.name.indexOf('on-') === 0) {
      var eventName = attr.name.replace('on-', '');
      var method = attr.value;
      var fn = view[method];
      if(!fn) throw new Error('Missing method');
      component.on(eventName, fn.bind(view));
    }

    // Bind properties
    else {
      this.interpolate(attr.value, function(val){
        component.set(attr.name, val);
      });
    }
  }

  view.once('mount', function(){
    component.mount(node, true);
    if(node === this.el) this.el = component.el;
  });

  view.on('destroy', function(){
    component.destroy();
  });
};


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
Compiler.prototype.processAttributes = function(node) {
  var view = this.view;
  var self = this;
  var attrs = attributes(node);
  function process(attr){
    var binding = self.getAttributeBinding(attr);
    if(binding) {
      binding.call(self, view, node, attr, attrs[attr]);
    }
    else {
      self.interpolateAttribute(node, attr);
    }
  }
  Object.keys(attrs).forEach(process);
};


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
Compiler.prototype.interpolateAttribute = function(node, attr) {
  var attrs = attributes(node);
  this.interpolate(attrs[attr], function(val){
    dom.write(function(){
      if(isBoolean(attr) && !val) {
        node.removeAttribute(attr);
      }
      else {
        node.setAttribute(attr, val);
      }
    });
  });
};


module.exports = function(View){

  /**
   * Compiler that renders binds the model to
   * the DOM elements and manages the bindings
   *
   * @type {Compiler}
   */
  var compiler = new Compiler();


  /**
   * Add a component
   *
   * @param {String} match
   * @param {Function} fn
   *
   * @return {View}
   */
  View.compose = function(match, fn) {
    compiler.component(match, fn);
    return this;
  };


  /**
   * Add a directive
   *
   * @param {String|Regex} match
   * @param {Function} fn
   *
   * @return {View}
   */
  View.directive = function(match, fn) {
    compiler.directive(match, fn);
    return this;
  };


  /**
   * Add an interpolation filter
   *
   * @param {String} name
   * @param {Function} fn
   *
   * @return {View}
   */
  View.filter = function(name, fn) {
    compiler.filter(name, fn);
    return this;
  };


  /**
   * Set the expression delimiters
   *
   * @param {Regex} match
   *
   * @return {View}
   */
  View.delimiters = function(match) {
    compiler.delimiters(match);
    return this;
  };


  /**
   * Render the view using the compiler
   *
   * @return {Element}
   */
  View.prototype.render = function() {
    var el = domify(this.template);
    return compiler.render(this, el);
  };


};