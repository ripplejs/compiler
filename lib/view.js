function View(el, children, bindings) {
  this.el = el;
  this.children = children;
  this.bindings = bindings;
}

View.prototype.unbind = function(){
  this.children.forEach(function(child){
    child.unbind();
  });
  this.bindings.forEach(function(unbind){
    unbind();
  });
};

module.exports = View;