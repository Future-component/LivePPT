/**
 * StorylinePPT
 * 1.0.0
 * Copyright (c) 2018-09-5 11:32:20 Beth
 * 基于storyline开发的支持拓课云教室的插件
 * depend [no]
 */

/**
 * 问题梳理：
 * 1.storyline的课件总页数
 * 2.storyline的事件监听处理
 * 3.翻页事件监听
 * 4.点击事件监听
 * 5.拖拽事件监听
 * 6.通过postMessage向上级发送消息
 * 7.禁止学生端操作keydown
 */

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define && define.amd ? define(factory) :
      (global.StorylinePPT = factory(global))
})(this, function(global) {
  'use strict';

  var Version = '1.0.0';
  var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ?
      'symbol' : typeof obj;
  }
  function isPlainObject(variable) {
    if (
      !variable ||
      (typeof variable === 'undefined' ? 'undefined' : _typeof(variable)) !== 'object' ||
      variable.nodeType ||
      Object.prototype.toString.call(variable) !== '[object Object]'
    ) {
      return false;
    }
    var proto = Object.getPrototypeOf(variable);
    return !proto || proto.hasOwnProperty('constructor') && proto.constructor === Object;
  }
  function isFunction(variable) {
    return Object.prototype.toString.call(variable) === '[object Function]';
  }

  function matchNumber(str) {
    var ary = [];
    str.replace(/\d+/g, function () {
      //调用方法时内部会产生 this 和 arguments
      ary.push(Number(arguments[0]));
      //查找数字后，可以对数字进行其他操作
      return arguments[0];
    })
    return ary;
  };

  var EventUtil = function () {
    function getById(id) {
      return document.getElementById(id);
    };
    // written by Dean Edwards, 2005
    // with input from Tino Zijdel, Matthias Miller, Diego Perini

    // http://dean.edwards.name/weblog/2005/10/add-event/

    function addEvent(element, type, handler) {
      if (element.addEventListener) {
        element.addEventListener(type, handler, false);
      } else {
        // assign each event handler a unique ID
        if (!handler.$$guid) handler.$$guid = addEvent.guid++;
        // create a hash table of event types for the element
        if (!element.events) element.events = {};
        // create a hash table of event handlers for each element/event pair
        var handlers = element.events[type];
        if (!handlers) {
          handlers = element.events[type] = {};
          // store the existing event handler (if there is one)
          if (element["on" + type]) {
            handlers[0] = element["on" + type];
          }
        }
        // store the event handler in the hash table
        handlers[handler.$$guid] = handler;
        // assign a global event handler to do all the work
        element["on" + type] = handleEvent;
      }
    };
    // a counter used to create unique IDs
    addEvent.guid = 1;

    function removeEvent(element, type, handler) {
      if (element.removeEventListener) {
        element.removeEventListener(type, handler, false);
      } else {
        // delete the event handler from the hash table
        if (element.events && element.events[type]) {
          delete element.events[type][handler.$$guid];
        }
      }
    };

    function handleEvent(event) {
      var returnValue = true;
      // grab the event object (IE uses a global event object)
      event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
      // get a reference to the hash table of event handlers
      var handlers = this.events[event.type];
      // execute each event handler
      for (var i in handlers) {
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) === false) {
          returnValue = false;
        }
      }
      return returnValue;
    };

    function fixEvent(event) {
      // add W3C standard event methods
      event.preventDefault = fixEvent.preventDefault;
      event.stopPropagation = fixEvent.stopPropagation;
      return event;
    };
    fixEvent.preventDefault = function () {
      this.returnValue = false;
    };
    fixEvent.stopPropagation = function () {
      this.cancelBubble = true;
    };

    function tableAddEvent() {

    };

    return {
      add: addEvent,
      remove: removeEvent,
      $: getById
    }
  }();

  function getIframeEle(iframeId, id){
    var ele = null;
    if(document.frames){
      ele = document.frames[iframeId].document.getElementById(id);
    }else{
      ele = document.getElementById(iframeId).contentWindow.document.getElementById(id);
    }
    return ele;
  }

  function simulateClick(ele, downSx, downSy, downCx, downCy, upSx, upSy, upCx, upCy){
    //点击位置为屏幕中间
    var w = window.innerWidth/2;
    var h = window.innerHeight/2;
    var eventDown = document.createEvent("MouseEvents");
    eventDown.initMouseEvent("mousedown",
      true, true,window, 0,
      downSx || w, downSy || h, downCx || w, downCy || h,
      false, false, false, false,0, null);
    var eventUp = document.createEvent("MouseEvents");
    eventUp.initMouseEvent("mouseup",
      true, true, window, 0,
      upSx || w, upSy || h, upCx || w, upCy || h,
      false, false, false, false, 0, null);
    ele.dispatchEvent(eventDown);
    ele.dispatchEvent(eventUp);
  }

  var topWinow = (function(){
    var p = window.parent;
    var pAry = [p];
    while(p != p.window.parent){
      p = p.window.parent;
      pAry.push(p);
    }
    return {
      top: p || window.top,
      arr: pAry,
    };
  })();

  var eventAry = ['mousedown', 'keydown'];

  function StorylinePPT(source, id) {

    return {
      // 保留，无用
      initAction: function(e) {
        if (eventAry.indexOf(e.type) > -1) {
          var data = null;
          if ((e.type === 'mousedown' || e.type === 'click') && e.target.id) {
            data = {
              cmd: 'slide-click',
              isTrusted: true,
              data: {
                id: e.target.id,
              },
            };
          } else if (e.type === 'keydown' && e.keyCode === 39) {
            data = {
              cmd: 'slide-goToPage',
              isTrusted: true,
              data: {
                eventType: 'next'
              },
            };
          } else if (e.type === 'keydown' && e.keyCode === 37) {
            data = {
              cmd: 'slide-goToPage',
              isTrusted: true,
              data: {
                eventType: 'last'
              },
            }
          }

          if (data) {
            topWinow.top.postMessage(JSON.stringify(data), '*');
          }
        }
      },

      init: function(res) {
        switch(res.cmd) {
          case 'slide-goToPage':
            this.slideChangeEvent(res.data);
            break;
          case 'slide-click':
            this.clickEvent(res.data.id);
            break;
          default:
            break;
        }
      },

      slideChangeEvent: function(res) {
        if (res.eventType === 'next') {
          this.slideNextPage();
        } else if (res.eventType === 'last') {
          this.slidePreviousPage();
        }
      },

      slideNextPage: function() {
        console.log('手动-slideNextPage');
        var event = new KeyboardEvent("keydown",{
          keyCode: 39,
        });
        document.body.dispatchEvent(event);
      },

      slidePreviousPage: function() {
        console.log('手动-slidePreviousPage');
        var event = new KeyboardEvent("keydown",{
          keyCode: 37,
        });
        document.body.dispatchEvent(event);
      },

      clickEvent: function(id) {
        console.log('手动-clickEvent');
        simulateClick(EventUtil.$(id))
      },

      addEvent: function(callback) {
        console.log(`%c ${source} addEvent`,'background:#aaa;color:#bada55');
        function listenerEvent(e) {
          console.log(`%c isTrusted: ${e.isTrusted}`,'background:#aaa;color:#000000');
          if (e.isTrusted) {
            if (isFunction(callback)) {
              callback(e);
            }
            console.log('正常触发', e.target.id)
          } else {
            console.log('模拟触发')
          }
        }

        EventUtil.add(EventUtil.$(id), 'click', listenerEvent, false)
        EventUtil.add(EventUtil.$(id), 'mousedown', listenerEvent, false)
        EventUtil.add(window, 'keydown', listenerEvent, false)
        EventUtil.add(window, 'keyup', listenerEvent, false)
        EventUtil.add(document, 'keydown', listenerEvent, false)
        EventUtil.add(document, 'keyup', listenerEvent, false)
      },

      receiveEvent: function(origin, callback) {
        console.log(`%c ${source} receiveEvent ${origin}`,'background:#aaa;color:#bada55');
        function listenerMessage(e) {
          console.log(`%c ${source} listenerMessage ${origin}`,'background:#aaa;color:#000000');
          if (origin && e.origin !== origin) {
            return;
          }
          if (isFunction(callback)) {
            var res = (isPlainObject(e.data) ? e.data : e.data && JSON.parse(e.data));
            callback(res);
          }
        }
        EventUtil.add(window, "message", listenerMessage, false);
      },

      getIframeEle: getIframeEle,

      matchNumber: matchNumber,
    }
  }

  var StorylinePPT$0 = StorylinePPT;

  return StorylinePPT$0;
})
