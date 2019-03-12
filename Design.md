# PPT对接规范

## 原则
* 简单
* 直接
* 清晰
* 正确

## 基于拓课云的公共课件内容修改

### 样式修改
```html
<link rel="stylesheet" href="https://uskid.oss-cn-beijing.aliyuncs.com/class/tuoke/newppt.20181128.css">
<style>
	#customPageController { display: none; }
	#videoMask { position: absolute; top: 0; left: 0; width: 100%; height: 100vh; background: #000; opacity: 0.5; z-index: 1; }
</style>
```

### 脚本修改
```js
window.GLOBAL.getUrlParams = window.GLOBAL.getUrlParams ||  function(key) {
  // var urlAdd = decodeURI(window.location.href);
  var urlAdd = decodeURIComponent(window.location.href);
  var urlIndex = urlAdd.indexOf("?");
  var urlSearch = urlAdd.substring(urlIndex + 1);
  var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");
  var arr = urlSearch.match(reg);
  if(arr != null) {
    return arr[2];
  } else {
    return "";
  }
  //reg表示匹配出:$+url传参数名字=值+$,并且$可以不存在，这样会返回一个数组
};

window.GLOBAL.loadScript =  window.GLOBAL.loadScript || function (url, callback) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  if( typeof(callback) != "undefined"  && typeof callback === 'function' ){
    if (script.readyState) {
      script.onreadystatechange = function () {
      if (script.readyState == "loaded" || script.readyState == "complete") {
        script.onreadystatechange = null;
        callback();
      }
      };
    } else {
      script.onload = function () {
        callback();
      };
    }
  }
  script.src = url;
  var loadJs = document.getElementById('loadJs') || document.body ;
  loadJs.appendChild(script);
}

var playerUrl = null;
var newpptUrl = null;
window.GLOBAL.loadScript(playerUrl);
window.GLOBAL.loadScript(newpptUrl);
```

### 脚本修改
```js
// var playerUrl = '../../Public/js/tkPptPlayer.js?remoteNewpptUpdateTime=' + (window.GLOBAL.getUrlParams(
// 'remoteNewpptUpdateTime') || new Date().getTime());
// var newpptUrl = '../../Public/js/tkPptController.js?remoteNewpptUpdateTime=' + (window.GLOBAL.getUrlParams(
// 'remoteNewpptUpdateTime') || new Date().getTime());

var playerUrl = 'https://demodoc.talk-cloud.net/Public/js/tkPptPlayer.js?remoteNewpptUpdateTime=' + (window.GLOBAL.getUrlParams(
    'remoteNewpptUpdateTime') || new Date().getTime());
var newpptUrl = 'https://demodoc.talk-cloud.net/Public/js/tkPptController.js?remoteNewpptUpdateTime=' + (window.GLOBAL.getUrlParams(
    'remoteNewpptUpdateTime') || new Date().getTime());

window.GLOBAL.loadScript(playerUrl);
window.GLOBAL.loadScript(newpptUrl);
```

### 额外脚本添加
```html
<script src="<%= cdn.uskid %>/lib/livePPT-1.0.0.js?t=<%= new Date().getTime() %>"></script>
<script>
  var LivePPT = new LivePPT('newppt');
  LivePPT.receiveEvent(null, function(res) {
    console.log('********* newppt接收 *********', res)
    // 确保过来的是ppt相关的消息
    LivePPT.init(res);
  });
</script>
```

## 基于Storyline的公共课件内容修改

### 额外脚本添加
```html
<script src="<%= cdn.uskid %>/lib/storylinePPT-1.0.0.js?t=<%= new Date().getTime() %>"></script>
<script>
  var storylinePPT = new StorylinePPT('storyline', 'preso');

  storylinePPT.addEvent(function(e) {
    console.log('********* storyline发送 *********', e);
    storylinePPT.initAction(e);
  });

  storylinePPT.receiveEvent(null, function(res) {
    if (!res.isTrusted) {
      console.log('********* storyline接收 *********', res)
      storylinePPT.init(res);
    }
  });
</script>

// 修改执行顺序
<script data-main="app/scripts/init.generated" src="/html5/lib/scripts/app.min.js"></script>
```

## PPT对接遇到的问题梳理
* 需要支持拓课云和Storyline两套方案
* 拓课云的h5-zip包需要手动修改原始文件，修改的远程js文件，存在拓课云升级造成的不可空因素
* 拓课云的事件指令升级，需要定期同步指令集
* 初始化时需要获取页面的总页数
* 被控制端初始化时不可点击，需要添加蒙版操作
* 初始化时音视频需要手动触发，才能支持被动播放操作-需要手动获取播放权限
* PPT中的视频同步问题，需要实现操作ppt内容的音视频文件的方法
* 视频的进度问题

## 拓课云PPT的模拟事件整理

`触发所有类型的事件`
```js
window.GLOBAL.ServiceNewPptAynamicPPT.clickNewpptTriggerEventHandler(temp4);
```

## tkPptController.js 源码修改

### 修改public的地址引用
源码
```bash
../../Public/media/test.mp3
```

修改之后
```bash
https://demodoc.talk-cloud.net/Public/media/test.mp3
```

### 隐藏js导入的css文件
注释修改之后
```js
// t = "https://demodoc.talk-cloud.net/Public/css/newppt.css?ts=2018081012", 
// (i = document.createElement("link")).type = "text/css", 
//   i.rel = "stylesheet", i.href = t, 
//   document.getElementsByTagName("head")[0].appendChild(i), 
```
