var Compiler = require('compiler');
var assert = require('assert');
var emitter = require('emitter');

describe('compiler', function(){

  it('should be created', function(done){
    try {
      var compiler = new Compiler();
      done();
    }
    catch(e) {
      done(false);
    }
  })

  it('should have directives', function(){
    var compiler = new Compiler({ foo: 'bar' });
    assert(compiler.directives.foo === 'bar');
  })

  it('should be an emitter', function(){
    var compiler = new Compiler();
    assert(compiler.on);
    assert(compiler.off);
    assert(compiler.emit);
  })

  it('should compile a node', function(){
    var el = document.createElement('div');
    var compiler = new Compiler();
    var view = compiler.compile(el);
  })

  it('should emit events on nodes', function(done){
    var el = document.createElement('div');
    var compiler = new Compiler();
    compiler.on('node', function(element){
      assert(element === el);
      done();
    })
    compiler.compile(el);
  })

  describe('directives', function(){

    it('should compile directives', function(done){
      var compiler = new Compiler({
        'commentbox': function(){
          done();
        }
      });
      var el = document.createElement('CommentBox');
      compiler.compile(el);
    })

    it('should bind to events if directive is an emitter', function(done){
      function CommentBox() {}
      emitter(CommentBox.prototype);
      var compiler = new Compiler({
        'commentbox': CommentBox
      });
      var el = document.createElement('CommentBox');
      el.setAttribute('events', '{ add: this.get("handleAdd") }');
      var component = compiler.compile(el, {
        handleAdd: function(){
          done();
        }
      });
      component.children[0].emit('add');
    })

  })


})