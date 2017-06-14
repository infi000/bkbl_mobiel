var DO = document,
    $DB = $("body"),
    mainVar = {},
    URL_dev = "http://www.xiaomaizhibo.com/cloudtest/",
    URL_socket = "ws://221.228.74.71:8124",
    params = {
        userInfo: 2109, //用户信息
        chatList: 7202, //聊天接口
        bkbl: 7105, //获取边看边聊
        chatSpeak: 7201, //聊天发言 type:空:文字，1:图片，2:语音
        delSpeak: 7203, //删除发言
        chatRepo: 7210, //回复评论
        delRepo: 7211, //删除评论
        chatRetort: 7215, //聊天点赞
        delRetort: 7216, //取消聊点赞
        presideList: 7222, //主持人发言列表
        presideRepo: 7225, //评论主持人发言
        presideDelRepo: 7226, //删除评论发言
        presideRetort: 7227, //主持人点赞
        presideDelReto: 7228, //取消主持人点赞
        broadList: 7114, //播报列表
        wonderList: 7252, //精彩列表
        wonderRepo: 7255, //精彩回复
        wonderDelRepo: 7256, //删除精彩回复
        wonderRetort: 7257, //精彩点赞
        wonderDelRetort: 7258, //取消精彩点赞
        getWonder: 7259, //精彩详情
        getShare: 7116, //获取分享设置
    },
    XID = getSearch().xopenid || "",
    TID = getSearch().talk_id || "",
    AU = getSearch().author || "",
    PW = localStorage.getItem("homePW") || "",
    PWT = localStorage.getItem("homePW_time") || "",
    atoken = "";

function getSearch(str) {
    var s = str || document.location.search;
    if (!s) return {};
    var arr = s.split("?")[1].split("&"),
        o = {};
    for (var i = 0; i < arr.length; i++) {
        var _key = arr[i].split("=")[0],
            _value = arr[i].split("=")[1];
        o[_key] = _value;
    }
    return o;
};

function typeOf(opt) {
    var o = opt,
        r;
    if (o && o.setAttribute) {
        return "dom";
    } else {
        r = Object.prototype.toString.call(o);
        return r.match(/\[object (.*?)\]/)[1].toLowerCase();
    }
};

function invoke(opt) {
    var $opt = opt || {},
        $url = $opt.url || "",
        $data = $opt.data,
        $fun = $opt.fun,
        $err = $opt.err || function(e) { alert(e) };
    $.ajax({
        url: URL_dev + $url,
        dataType: 'jsonp',
        data: $data,
        success: function(data) {
            var _data = data.data,
                _status = data.status,
                _msg = data.msg;
            if (_status == 0) {
                //失败
                $err(_msg);
                return
            }
            $fun(_data);
        }
    });
};

function arrayDel(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            arr.splice(i, 1);
            break;
        }
    }
}


(function(doc, win) {
    var docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function() {
            var clientWidth = docEl.clientWidth;
            var clientHeight = docEl.clientHeight;
            if (!clientWidth) return;
            //客户端变换
            //1banner 高度 2评论区高度 3视频高度
            var bn1 = $(".swiper-slide-a"),
                con = $(".page_bd"),
                video = $("#video"),
                bn1_h = 0,
                con_h,
                video_h;
            // if (typeOf(bn1[0]) == "dom") {
            //     bn1_h = $DB.width() / 8;
            //     bn1.height(bn1_h);
            // }
            if (typeOf(video[0]) == "dom") {
                video_h = $DB.width() * (9 / 16);
                    if(video_h>500){
                        video_h=500;
                    }
                video.height(video_h);
            }
            if (typeOf(con[0]) == "dom") {
                // var hd_h = $(".page_hd").height() + 50,
                //     con_h = clientHeight - hd_h - 100;
                // var hd_h = video_h + 50,
                //     con_h = clientHeight - hd_h - 100;
                // console.log(clientHeight, hd_h, con_h);
                // con.height(con_h)
                var con_h=clientHeight-video_h;
                con.height(con_h);
            }

        };
    if (!doc.addEventListener) return;
    win.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);

function imgError(image, url, style) {
    image.onerror = "";
    image.src = url || "./img/logo2.png";
    var _s = style || {};
    $(image).css(_s);
    return true;
}

function getAtoken() {
    var data = { m: 2101, token: '3209ade809e14ff107dbb0654b8b4641', at: timestamp() };
    invoke({
        data: data,
        fun: function(d) {
            atoken = d
        }
    });
};

function timestamp() {
    //时间戳
    return new Date().getTime()
};

//字符串长度
function strlen(str) {
    return str.replace(/[^\x00-\xff]/g, "**").length;
}
