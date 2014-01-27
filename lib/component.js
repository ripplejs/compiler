function Component(el, children) {
  this.el = el;
  this.children = children;
}

Component.prototype.remove = function(){
  if(this.el.parentNode) this.el.parentNode.removeChild(this.el);
  this.children.forEach(function(child){
    child.remove();
  });
};

module.exports = Component;