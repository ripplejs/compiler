var compiler = require('compiler');
var assert = require('assert');
var createView = require('view');
var dom = require('fastdom');

describe('compiler', function(){
  var View;

  beforeEach(function(){
    View = createView('<div></div>').use(compiler);
  });


  describe('lifecycle', function () {

    it.skip('should render when the view is created', function () {

    });

    it.skip('should enable bindings until view is mounted', function () {

    });

    it.skip('should disable all binding when unmounted', function(){

    })

    it.skip('should trigger all bindings before element is mounted', function () {

    });

    it.skip('should destroy all bindings when the view is destroyed', function () {

    });

    it.skip('should not be able to be rendered once destroyed', function () {

    });

  });

  describe('directives', function () {

    it('should match directives with a string', function(done){
      View = createView('<div data-test="foo"></div>').use(compiler);
      View.directive('data-test', function(view, el, attr, value){
        dom.defer(function(){
          assert(value === "foo");
          done();
        });
      });
      var view = new View();
    });

    it('should match directives with a regex', function(done){
      View = createView('<div data-test="foo"></div>').use(compiler);
      View.directive(/test/, function(view, el, attr, value){
        assert(value === "foo");
        done();
      });
      var view = new View();
    });

  });


  describe('components', function () {

    it('should match components with a string', function(done){
      var Parent = createView('<div><dummy></dummy></div>').use(compiler);
      var Child = createView('<div id="child"></div>');
      Parent.compose('dummy', Child);
      var view = new Parent();
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.firstChild.id === "child");
        view.unmount();
        done();
      });
    });

    it('should pass data to the component', function (done) {
      var Parent = createView('<div><dummy foo="bar"></dummy></div>').use(compiler);
      var Child = createView('<div id="{{foo}}"></div>').use(compiler);
      Parent.compose('dummy', Child);
      var view = new Parent();
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.firstChild.id === "bar");
        view.unmount();
        done();
      });
    });

    it('should pass data as an expression to the component', function (done) {
      var Parent = createView('<div><dummy color="{{color}}"></dummy></div>').use(compiler);
      var Child = createView('<div id="{{color}}"></div>').use(compiler);
      Parent.compose('dummy', Child);
      var view = new Parent({
        color: 'red'
      });
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.firstChild.id === "red");
        view.unmount();
        done();
      });
    });

    it('should pass dynamic data to the component', function (done) {
      var Parent = createView('<div><dummy color="{{color}}"></dummy></div>').use(compiler);
      var Child = createView('<div id="{{color}}"></div>').use(compiler);
      Parent.compose('dummy', Child);
      var view = new Parent({
        color: 'red'
      });
      view.mount(document.body);
      view.set('color', 'blue');
      dom.defer(function(){
        assert(view.el.firstChild.id === "blue");
        view.unmount();
        done();
      });
    });

    it('should pass raw data to the component', function (done) {
      var Parent = createView('<div><dummy colors="{{colors}}"></dummy></div>').use(compiler);
      var Child = createView('<div id="{{colors | dashed}}"></div>').use(compiler);
      Parent.compose('dummy', Child);
      Child.filter('dashed', function(arr){
        return arr.join('-');
      });
      var view = new Parent({
        colors: ['red','blue','green']
      });
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.firstChild.id === "red-blue-green");
        view.unmount();
        done();
      });
    });

    it('should use a custom template', function (done) {
      var Parent = createView('<div><dummy color="blue"><div>{{color}}</div></dummy></div>').use(compiler);
      var Child = createView('<div id="{{color}}"></div>').use(compiler);
      Parent.compose('dummy', Child);
      var view = new Parent();
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.firstChild.id === "");
        assert(view.el.firstChild.innerHTML === "blue");
        view.unmount();
        done();
      });
    });

    it('should lookup data from the parent', function (done) {
      var Parent = createView('<div><dummy></dummy></div>').use(compiler);
      var Child = createView('<div id="{{color}}"></div>').use(compiler);
      Parent.compose('dummy', Child);
      var view = new Parent({
        color: 'blue'
      });
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.firstChild.id === "blue");
        view.unmount();
        done();
      });
    });

    it('should allow a component as the root element', function (done) {
      var Parent = createView('<dummy></dummy>').use(compiler);
      var Child = createView('<div id="blue"></div>').use(compiler);
      Parent.compose('dummy', Child);
      var view = new Parent();
      view.mount(document.body);
      dom.defer(function(){
        assert(view.el.id === "blue");
        view.unmount();
        done();
      });
    });

  });

  describe('text interpolation', function () {

    it('should interpolate text nodes', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: 'bar'
      });
      dom.defer(function(){
        assert(view.el.innerHTML === 'bar');
        done();
      });
    })

    it('should batch text node interpolation', function(){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: 'bar'
      });
      assert(view.el.innerHTML !== 'bar');
    })

    it('should update interpolated text nodes', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: 'bar'
      });
      view.set('foo', 'baz');
      dom.defer(function(){
        assert(view.el.innerHTML === 'baz');
        done();
      });
    })

    it('should handle elements as values', function(done){
      var test = document.createElement('div');
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: test
      });
      dom.defer(function(){
        assert(view.el.firstChild === test);
        done();
      });
    })

    it('should update elements as values', function(done){
      var test = document.createElement('div');
      var test2 = document.createElement('ul');
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: test
      });
      view.set('foo', test2);
      dom.defer(function(){
        assert(view.el.firstChild === test2);
        done();
      });
    })

    it('should handle when the value is no longer an element', function(done){
      var test = document.createElement('div');
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: test
      });
      view.set('foo', 'bar');
      dom.defer(function(){
        assert(view.el.innerHTML === 'bar');
        done();
      });
    });

    it('should return undefined values as an empty string', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: undefined
      });
      dom.defer(function(){
        assert(view.el.innerHTML === '');
        done();
      });
    });

    it('should return null values as an empty string', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: null
      });
      dom.defer(function(){
        assert(view.el.innerHTML === '');
        done();
      });
    });

    it('should return false values as an empty string', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: false
      });
      dom.defer(function(){
        assert(view.el.innerHTML === '');
        done();
      });
    });

    it('should return true values as an empty string', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: true
      });
      dom.defer(function(){
        assert(view.el.innerHTML === '');
        done();
      });
    });

    it('should update from an non-string value', function(done){
      var View = createView('<div>{{foo}}</div>').use(compiler);
      var view = new View({
        foo: undefined
      });
      view.set('foo', 'bar');
      dom.defer(function(){
        assert(view.el.innerHTML === 'bar');
        done();
      });
    });

  });


  describe('attribute interpolation', function () {

   it('should interpolate attributes', function(done){
      var View = createView('<div id="{{foo}}"></div>').use(compiler);
      var view = new View({
        foo: 'bar'
      });
      dom.defer(function(){
        assert(view.el.id === 'bar');
        done();
      });
    })

    it('should update interpolated attributes', function(){
      var View = createView('<div id="{{foo}}"></div>').use(compiler);
      var view = new View({
        foo: 'bar'
      });
      view.set('foo', 'baz');
      dom.defer(function(){
        assert(view.el.id === 'baz');
      });
    })

    it('should toggle boolean attributes', function(){
      var View = createView('<div hidden="{{hidden}}"></div>').use(compiler);
      var view = new View({
        hidden: true
      });
      dom.defer(function(){
        assert(view.el.hasAttribute('hidden'));
        view.set('hidden', false);
        dom.defer(function(){
          assert(view.el.hasAttribute('hidden') === false);
        });
      });
    })


  });

  describe('interpolation settings', function () {

    it('should change delimiters', function (done) {
      var View = createView('<div id="<% foo %>"></div>').use(compiler);
      View.delimiters(/\<\%(.*?)\%\>/g);
      var view = new View({
        foo: 'bar'
      });
      dom.defer(function(){
        assert(view.el.id === "bar");
        done();
      });
    })

    it('should add filters', function (done) {
      var View = createView('<div>{{foo | caps}}</div>').use(compiler);
      View.filter('caps', function(val){
        return val.toUpperCase();
      });
      var view = new View({
        foo: 'bar'
      });
      dom.defer(function(){
        assert(view.el.innerHTML === "BAR");
        done();
      });
    })

  });

})