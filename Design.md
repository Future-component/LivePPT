# PPT对接规范

## 原则
* 简单
* 直接
* 清晰
* 正确

## 基于拓课云的公共方法修改

### 样式修改
```html
<link rel="stylesheet" href="https://demodoc.talk-cloud.net/Public/css/newppt.css">
<style>
  #customPageController { display: none }
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

### 额外脚本添加
```html
<script src="http://index.uskid.tech:8082/livePPT-1.0.0.js?t=18"></script>
<script>
  var LivePPT = new LivePPT('newppt');
  LivePPT.receiveEvent(null, function(res) {
    console.log('********* newppt接收 *********', res)
    // 确保过来的是ppt相关的消息
    LivePPT.init(res);
  });
</script>
```

## 基于Storyline的公共方法修改

### 额外脚本添加
```html
<script src="http://index.uskid.tech:8082/StorylinePPT-1.0.0.js"></script>
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
```