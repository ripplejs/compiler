var Compiler = require('compiler');
var assert = require('assert');
var emitter = require('emitter');
var createView = require('view');

describe('compiler', function(){
  var compiler;

  beforeEach(function(){
    compiler = new Compiler();
  });

  it('should compile a view', function(){
    var compiler = new Compiler();
    var View = createView('<div></div>');
    var view = new View();
    compiler.compile(view);
  })

  it('should match attributes with a string', function(done){
    var compiler = new Compiler();
    compiler.addAttribute('data-test', function(view, el, attr, value){
      assert(value === "foo");
      done();
    });
    var View = createView('<div data-test="foo"></div>');
    var view = new View();
    compiler.compile(view);
  });

  it('should match attributes with a regex', function(done){
    var compiler = new Compiler();
    compiler.addAttribute(/test/, function(view, el, attr, value){
      assert(value === "foo");
      done();
    });
    var View = createView('<div data-test="foo"></div>');
    var view = new View();
    compiler.compile(view);
  });

  it('should match components with a string', function(done){
    var compiler = new Compiler();
    function Dummy(){
      done();
    }
    compiler.addComponent('dummy', Dummy);
    var View = createView('<dummy></dummy>');
    var view = new View();
    compiler.compile(view);
  });

  it('should interpolate text nodes', function(){
    var View = createView('<div>{{foo}}</div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    assert(view.el.innerHTML === 'bar');
  })

  it('should update interpolated text nodes', function(){
    var View = createView('<div>{{foo}}</div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    view.set('foo', 'baz');
    assert(view.el.innerHTML === 'baz');
  })

  it('should interpolate attributes', function(){
    var View = createView('<div id="{{foo}}"></div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    assert(view.el.id === 'bar');
  })

  it('should update interpolated attributes', function(){
    var View = createView('<div id="{{foo}}"></div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    view.set('foo', 'baz');
    assert(view.el.id === 'baz');
  })

  it('should remove attribute interpolation bindings', function(){
    var View = createView('<div id="{{foo}}"></div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    view.unbind();
    view.set('foo', 'baz');
    assert(view.el.id === 'bar', view.el.id);
  })

  it('should remove text interpolation bindings', function(){
    var View = createView('<div>{{foo}}</div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    view.unbind();
    view.set('foo', 'baz');
    assert(view.el.innerHTML === 'bar');
  })

  it('should rebind text interpolation bindings', function(){
    var View = createView('<div>{{foo}}</div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    view.unbind();
    view.bind();
    view.set('foo', 'baz');
    assert(view.el.innerHTML === 'baz');
  })

  it('should rebind the attribute interpolation binding', function(){
    var View = createView('<div id="{{foo}}"></div>');
    var view = new View({
      foo: 'bar'
    });
    compiler.compile(view);
    view.unbind();
    view.bind();
    view.set('foo', 'baz');
    assert(view.el.id === 'baz');
  })

  it('should toggle boolean attributes', function(){
    var View = createView('<div hidden="{{hidden}}"></div>');
    var view = new View({
      hidden: true
    });
    compiler.compile(view);
    assert(view.el.hasAttribute('hidden'));
    view.set('hidden', false);
    assert(view.el.hasAttribute('hidden') === false);
  })

})