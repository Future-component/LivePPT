/**
 * LivePPT
 * 1.0.0
 * Copyright (c) 2018-08-22 11:32:20 Beth
 * 直播调用PPT
 * depend [no]
 */

/**
 * 问题梳理：
 * 1.两端的页面加载不同步问题
 * 2.标准的数据结构
 * 3.不同端的权限不同
 * 4.如果用户断开之后如何回到上一步上课状态
 * 5.如何处理不同角色PPT的样式
 * 6.PPT转H5本身的问题严重
 */

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.LivePPT = factory(global))
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
    function getByid(id) {
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
      $: getByid
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
  
  function LivePPT(ele, src, role) {
    if (ele && src) {
      console.log(ele.clientWidth, ele.clientHeight);
      ele.height = ele.clientWidth / (16 / 9);
      ele.src = src;
    }
    
    return {
      init: function(res) {
        if (res.source === 'tk_dynamicPPT') {
          this.action(res.data);
        }
      },
      action: function(res) {
        switch(res.action) {
          case 'slideChangeEvent':
            this.jumpPage(res.slide + res.stepTotal);
            break;
          case 'clickNewpptTriggerEvent':
            // tky课件会自动同步事件
            break;
          default: 
            break;
        }
      },
      jumpPage: function(page) {
        if (role === 'student') {
          this.hideCustomPage();
        }
        $('#customController_skipSlide').val(page);
        window.GLOBAL.ServiceNewPptAynamicPPT.clearOldSlideInfo();
        window.GLOBAL.ServiceNewPptAynamicPPT.playbackController.gotoTimestamp(Number($('#customController_skipSlide').val()) - 1, 0, 0, !0, {
          initiative: !0
        })
      },
      hideCustomPage: function() {
        var timer = setInterval(function() {
          var ele = document.getElementById("customPageController");
          // 强制判断ppt加载成功的状态
          if (GLOBAL.isLoadPageController && ele && ele.style.display !== 'none') {
            ele.style.display = 'none';
            clearInterval(timer);
            timer = null;
          }
        }, 200);
      },
      addEvent: function(callback) {
        function listenerEvent(e) {
          console.log(e.isTrusted, e.type, e);
          if (isFunction(callback)) {
            callback(e);
          }
          if (e.isTrusted) {
            console.log(e.target.id)
          }
        }
        EventUtil.add(window, 'click', listenerEvent, false)
        EventUtil.add(window, 'mousedown', listenerEvent, false)
        EventUtil.add(window, 'keydown', listenerEvent, false)
      },
      receiveEvent: function(origin, callback) {
        function listenerMessage(e) {
          console.log('listenerMessage', e)
          if (e.origin !== origin) {
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

  var LivePPT$0 = LivePPT;
  
  return LivePPT$0;
})