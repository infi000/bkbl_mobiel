var WSnum = "",
    NUM = "";
var au;
$(document).ready(function($) {
    var mySwiper = new Swiper('.swiper-container', {
        autoplay: 5000, //可选选项，自动滑动
    });
    getAtoken();
    z_init.init();

});
wsInit();

var z_init = new Z_init();

function Z_init() {
    var that = this,
        part = "host", //当前TAG位置host,wonder,chat
        page = 1, //精彩页数
        // lock = { host: true, wonder: true, chat: true }, //防止重复请求
        reId = 0, //回复ID等
        reEle, //选定元素等
        lastId, //最后一条聊天的ID
        recordTime = 60, //录音时间
        top = 99, //置顶请求数量
        imgArr = [], //上传图片数组
        wximgArr = [], //微信服务器图片数组
        wonderdt = {}, //精彩的存储对象
        preImg = {}; //预览图片临时存贮
    this.ele = {
        mask: $("<div class='weui-mask'>")[0],
        nav: $('<div class="weui-navbar act_rl">\
                   <div class="weui-navbar__item" id="btn_repo" style="display:none"><i class="iconfont icon-fenxiang"></i>引用</div>\
                    <div class="weui-navbar__item" id="btn_star"><i class="iconfont icon-xihuan"></i><span id="hasRetort"></span></div>\
                    <div class="weui-navbar__item btn_comment"><i class="iconfont icon-pinglun"></i>评论</div>\
               </div>')[0],
        speak: $('<div class="speak">\
                   <a href="javascript:;" class="weui-btn weui-btn_primary btn_comment" dataType="0">发言</a>\
                 </div>')[0],
        recordLoding: $('<div >\
                <div class="weui-mask_transparent"></div>\
                <div class="weui-toast" id="recordLodingTosat">\
                    <i class="weui-loading weui-icon_toast"></i>\
                    <p class="weui-toast__content" id="recordLodingNum"></p>\
                    <p class="weui-toast__content">点击停止录音</p>\
                </div>\
            </div>')[0],
        nowLoding: $('<div class="weui-loadmore">\
                    <i class="weui-loading"></i>\
                    <span class="weui-loadmore__tips">正在加载</span>\
                </div>')[0],
        dialog: "", //对话框
        preview: "", //预览图
    };
    this.bkblInfo = {}; //边看边聊信息
    this.data = {
        // talk_id: TID || "db5f5add5a74aa627d48b7d7da1c4b00",
        // xopenid: XID || "oXhPVvmTMDsrjcD0eb9yltn9N4Z4",
        // author: AU || 'R3ozMvIAQfcOPjsE1HOqa1ZjYJsaoXerhqn1l8TPtskJnqw1z9ofTTyNx9dC6EwYbpo_NFrLxPMyE0H1R8r-JQ'
        talk_id: TID,
        xopenid: XID,
        author: AU,
    };
    this.cl = {}; //聊天列表对象
    this.init = function() {
        that.get_userInfo();
        that.event();
    };
    this.event = function() {
        $DB.on("click", function(e) {
            var ele = e.target;
            switch (ele) {
                case that.ele.mask:
                    close();
                    break;
            };

        });
        $DB.on("click", "#main_navbar .weui-navbar__item", function(e) {
            var type = $(this).attr("dataType"),
                ld = $(z_init.ele.nowLoding).css("display");
            if (ld == "block" && type == part) {
                //判断是否加载完
                return
            }
            part = type;
            //切换mainavbar
            $(this).addClass('weui-bar__item_on')
                .siblings()
                .removeClass('weui-bar__item_on');
            // $("#container").find(".weui-panel__bd").hide();
            $(that.ele.speak).remove();
            $("#chatBox").html("").append(that.ele.nowLoding);
            top = 99;
            switch (type) {
                case "wonder":
                    //精彩

                    // $("#wonderBox").show();
                    page = 1;
                    that.get_wonderList({ page: page })
                    break;
                case "host":
                    //主持
                    that.get_presideList();
                    break;
                case "chat":
                    //聊天
                    if (that.bkblInfo.sright != 3) {
                        // sright: 发言权限 1 都可以 2 需审核 3 都不可
                        $(".page").append(that.ele.speak);
                    }
                    that.get_chatList();
                    break;
            };
        });
        $DB.on("click", ".btn_getTools", function(e) {
            //点击功能按钮
            e.stopPropagation();
            var dataType = $(this).closest('.weui-media-box_appmsg').attr("dataType");
            reId = JSON.parse(decodeURIComponent(dataType));
            reEle = $(this).closest('.weui-media-box_appmsg');
            var s = (reId.retort) ? "取消" : "点赞";
            $(that.ele.mask).css("opacity", "0");
            // $DB.append(that.ele.mask);
            $(this).after(that.ele.mask);
            $(this).after(that.ele.nav);
            $("#hasRetort").html(s)
        });
        $DB.on("click", ("#btn_repo"), function(e) {
            //点击引用按钮
            e.stopPropagation();
            close();
            console.log("引用")
        });
        $DB.on("click", ("#btn_star"), function(e) {
            //点赞
            e.stopPropagation();
            close();
            var t = reId.retort;
            if (t) {
                //取消点赞
                that.del_retort();
            } else {
                that.send_retort();
            }

        });
        $DB.on("click", (".btn_reComment"), function(e) {
            //回复评论
            e.stopPropagation();
            var dataType = $(this).closest('.weui-media-box_appmsg').attr("dataType"),
                d = { type: "repo" };
            if (that.bkblInfo.cright == 3) {
                alert("管理员限制评论");
                return;
            }
            reId = JSON.parse(decodeURIComponent(dataType));
            reEle = $(this).closest('.weui-media-box_appmsg');
            //评论的ID
            that.ele.comment = that.dom_comment(d);
            $DB.append(that.ele.comment);
            $(that.ele.comment).slideDown('fast');
        });
        $DB.on("click", (".btn_comment"), function(e) {
            //评论
            e.stopPropagation();

            if (that.btnonOFF) {
                //防止点击过快
                return;
            }
            that.btnonOFF = 1;
            close();
            var d = { type: "repo" };
            if ($(this).attr("dataType") == 0) {
                //聊天发言
                reId = 0;
                d = "";
                imgArr = [];
                if (part == "wonder") {
                    reId = 1;
                    d = { type: "repo" };
                }
            };
            if (d != "" && that.bkblInfo.cright == 3) {
                delete that.btnonOFF;
                alert("管理员限制评论");
                return
            }
            that.ele.comment = that.dom_comment(d);
            $DB.append(that.ele.comment);
            $(that.ele.comment).slideDown('fast', function() {
                delete that.btnonOFF
            });
        });
        $DB.on("click", ".rep_del", function(e) {
            //删除留言
            e.stopPropagation();
            reEle = $(this).closest('.weui-media-box_appmsg');
            var s = reEle.attr("dataType"),
                dataType = JSON.parse(decodeURIComponent(s));
            that.ele.dialog = that.dom_dialog({ fun: function() { that.del_chat(dataType) } });
            $DB.append(that.ele.mask);
            $DB.append(that.ele.dialog);
            // that.del_chat(dataType);

        });
        $DB.on("click", "#btn_voice", function(e) {
            //录音
            wx.startRecord();

            function startTime() {
                if (recordTime == 0) {
                    that.ele.recordLoding.remove();
                    that.weixin.record.stop({ fun: that.weixin.record.upload });
                    // that.weixin.record.upload(id);
                    recordTime = 60;

                    return;
                }
                $("#recordLodingNum").html("录音中 (" + recordTime + "s)");
                recordTime--;
                t = setTimeout(function() { startTime() }, 1000)
            };
            $DB.append(that.ele.recordLoding);
            startTime();
        });
        $DB.on("click", "#recordLodingTosat", function(e) {
            //停止录音
            recordTime = 0;
        });
        $DB.on("click", ".btn_playRecord", function(e) {
            //播放语音
            var id = $(this).attr("dataType"),
                ele = $(this).find(".audioPlaying")[0];
            // that.weixin.record.download({
            //     id: id,
            //     fun: function(msg) {
            //         wx.playVoice({
            //             localId: msg // 需要播放的音频的本地ID，由stopRecord接口获得
            //         });
            //     }
            // });
            // ###########

            if (that.voice_playing) {
                //stop
                // $(that.voice_playEle).css({ "background": "#9E9E9E" });
                var _ele = that.voice_playEle,
                    _vid = that.voice_playId;
                $(_ele).hide();
                delete that.voice_playId;
                delete that.voice_playing;
                delete that.voice_playEle;
                wx.stopVoice({
                    localId: _vid // 需要停止的音频的本地ID，由stopRecord接口获得
                });
            } else {
                that.voice_playing = true;
                that.voice_playEle = ele;
                that.weixin.record.download({
                    id: id,
                    fun: function(msg) {
                        //动画播放中。。。
                        $(ele).show();
                        that.voice_playId = msg;
                        wx.playVoice({
                            localId: msg // 需要播放的音频的本地ID，由stopRecord接口获得
                        });
                    }
                });
            }
        });
        $DB.on("click", ".btn_playRecord2", function(e) {
            var ele = this,
                auEle = $(this).siblings('audio')[0];
            // cEle = $(this).find(".audioPlaying")[0];
            // //播放已下载到服务器的语音
            // if (that.audio_playing) {
            //     //语音正在播放，停止并删除播放提示
            //     var _auEle = that.audio_playEle,
            //         _cEle = that.audio_playcEle;
            //     _auEle.pause();
            //     if (auEle != _auEle) {
            //         //不是当前语音，播放当前的  
            //         auEle.play();
            //         $(cEle).show();
            //         that.audio_playEle = auEle;
            //         that.audio_playcEle = cEle;
            //         that.audio_playing = true
            //     }
            // } else {
            //     that.audio_playing = true;
            //     that.audio_playEle = auEle;
            //     that.audio_playcEle = cEle;
            //     auEle.play();
            //     $(cEle).show();
            // }

            // if (that.audio_playing) {
            //     //如果在audio元素在播放
            //     that.audio_stop();
            // } else {
            //     //播放audio元素
            //     auEle.play();
            //     that.audio_play(auEle);
            // }
            // auEle.pause();
            if (that.audio_playing) {
                if (auEle != that.audio_playEle) {
                    //元素相同

                    that.audio_playEle.pause();
                    auEle.play();
                } else {
                    that.audio_playEle.pause();
                }
            } else {
                auEle.play();
            }

        });

        $DB.on("ended", "audio", function(e) {
            alert("自动播放结束");
        });
        $DB.on("play", "audio", function(e) {
            alert("自动播放开始");
        });
        $DB.on("click", "#btn_picture", function(e) {
            //传图
            if (imgArr.length == 1) {
                alert("已上传图片");
                return
            }
            that.weixin.img.choose({
                fun: function(d1) {
                    var _d1 = d1;
                    that.weixin.img.upload({
                        id: _d1[0],
                        fun: function(d2) {
                            var _d2 = d2;
                            that.weixin.img.download({
                                id: _d2,
                                fun: function(d) {
                                    var _d = d;
                                    imgArr.push(_d2);
                                    if (window.__wxjs_is_wkwebview) {
                                        //WKWebview内核
                                        wx.getLocalImgData({
                                            localId: _d, // 图片的localID
                                            success: function(res) {
                                                var localdata = res.localData; // localData是图片的base64数据，可以用img标签显示
                                                var tmpl = '<li class="weui-uploader__file" style="text-align:center;overflow:hidden;background:#000"><img src="' + localdata + '" style="max-height:100%;" class="btn_preview" dataType="' + _d2 + '"></li>';
                                                $("#uploaderFiles").append($(tmpl));
                                            }
                                        });
                                    } else {
                                        var tmpl = '<li class="weui-uploader__file" style="text-align:center;overflow:hidden;background:#000"><img src="' + _d + '" style="max-height:100%;" class="btn_preview" dataType="' + _d2 + '"></li>';
                                        $("#uploaderFiles").append($(tmpl));
                                    }

                                }
                            });
                        }
                    });
                }
            })
        });
        $DB.on("click", ".btn_preview", function(e) {
            //预览图片
            var src = $(this).attr("src");
            var data = { src: src, style: "style='display:none'" },
                type = $(this).attr("dataType") || "",
                ele = this;
            if (type != "") {
                data.style = "style='display:block'";
                preImg = { id: type, ele: ele };
            }
            that.ele.preview = that.dom_preview(data);
            $DB.append(that.ele.preview);
        });
        $DB.on("click", "#previewImg", function(e) {
            //点击预览图退出
            $(that.ele.preview).fadeOut(function() {
                $(this).remove();
            })
        });
        $DB.on("click", "#btn_delImg", function(e) {
            //删除预览图
            e.stopPropagation();
            var id = preImg.id,
                ele = preImg.ele;
            arrayDel(imgArr, id);
            $(ele).remove();
            $(that.ele.preview).fadeOut(function() {
                $(this).remove();
            })
        });
        $DB.on("change", ".uploaderInput", function(e) {
            //上传图片（没用了）
            var src, url = window.URL || window.webkitURL || window.mozURL,
                files = e.target.files,
                tmpl = '<li class="weui-uploader__file" style="background-image:url(#url#)"></li>'
            for (var i = 0, len = files.length; i < len; ++i) {
                var file = files[i];

                if (url) {
                    src = url.createObjectURL(file);
                } else {
                    src = e.target.result;
                }

                $("#uploaderFiles").append($(tmpl.replace('#url#', src)));
            }
        });
        $DB.on("click", "#btn_send", function(e) {
            //发布
            var data = "";
            if (reId == 0) {
                if (imgArr.length > 0) {
                    //发图片 图片间用一个“|”，图片文字间用二个“||”，
                    var arr = imgArr.join("|");
                    data = {
                        type: 1,
                        msg: arr
                    }
                }
                that.send_words(data)
            } else if (reId == 1) {
                that.send_wonder();
            } else {
                that.send_repo();
            }
        });
        $DB.on("click", "#btn_commentBack", function(e) {
            //返回
            $(that.ele.comment).slideUp('fast', function() {
                that.toggle_video();
                $(that.ele.comment).remove();
            })
        });
        $DB.on("click", "#btn_more", function(e) {
            //加载更多
            $(this).after(that.ele.nowLoding).remove();
            switch (part) {
                case "host":
                    //
                    that.get_presideList({ id: lastId });
                    break;
                case "wonder":
                    //
                    page = page + 1;
                    that.get_wonderList({ page: page })
                    break;
                case "chat":
                    //
                    that.get_chatList({ id: lastId });
                    break;
            }
        });
        $DB.on("click", "#btn_playVideo", function(e) {
            //播放视频
            that.playVideo();
        });
        $DB.on("click", ".btn_chatMsg", function(e) {
            //聊天内容
            var clamp = $(this).css("-webkit-line-clamp");
            if (clamp == 2) {
                $(this).css("-webkit-line-clamp", "initial");
            } else {
                $(this).css("-webkit-line-clamp", "2");
            }
        });
        $DB.on("click", ".btn_broad", function(e) {
            //查看播报
            var type = $(this).attr("dataType");
            type = JSON.parse(decodeURIComponent(type));
            var ele = that.dom_broad(type)[0];
            $DB.append(ele);
            $(ele).fadeIn("fast");
        });
        $DB.on("click", "#btn_broadBd", function(e) {
            $(this).fadeOut("fast", function() {
                this.remove();
            })
        });
        $DB.on("click", ".btn_playView", function(e) {
            var data = $(this).attr("dataType"),
                html = '<iframe class="viewVideo"  frameborder="0" src="./playMp4.html?source=' + data + '"></iframe>',
                fEle = $(this).closest('.viewType');
            fEle.html(html);

        });
        $DB.on("click", ".btn_wonder", function(e) {
            //获取精彩
            var dt = $(this).attr("dataType");
            dt = JSON.parse(dt);
            invoke({
                data: {
                    m: params.getWonder,
                    id: dt.id,
                    talk_id: that.data.talk_id,
                    xopenid: that.data.xopenid,
                    author: that.data.author
                },
                fun: function(d) {
                    wonderdt = d;
                    wonderdt.id = dt.id;
                    var ele = that.dom_wonder(d)[0];
                    $DB.append(ele);
                    $(ele).fadeIn("fast", function() {
                        $(ele).append(that.ele.speak)
                    });
                }
            })

        });
        $DB.on("click", ".btn_wonderRet", function(e) {
            //点赞
            e.stopPropagation();
            var dt = $(this).closest('.btn_wonder').attr("dataType");
            dt = JSON.parse(dt);
            var num = $(this).find("span").html() || 0,
                _this = $(this).find("span");
            var data = {
                m: params.wonderRetort,
                cid: dt.id,
                talk_id: that.data.talk_id,
                xopenid: that.data.xopenid,
                author: that.data.author
            };
            invoke({
                data: data,
                fun: function(d) {
                    that.count({ type: 4 })
                    $(_this).html(parseInt(num) + 1);
                },
                err: function(d) {
                    //取消点赞
                    data.id = dt.id;
                    data.m = params.wonderDelRetort;
                    invoke({
                        data: data,
                        fun: function(d) {
                            var res = parseInt(num) - 1 || "";
                            $(_this).html(res);
                        }
                    })
                }
            });

        });
        $DB.on("click", "#wonderBack", function(e) {
            $("#wonderBd").fadeOut("fast", function() {
                that.toggle_video();
                this.remove();
            })
        });
        // var container_h = $("#container").height();
        // $("#container").on("scroll", function(e) {
        //     //聊天内容区域滚动时隐藏banner和tag
        //     console.log($(this).scrollTop());
        //     var top = $(this).scrollTop();
        //     // if (top > 100) {
        //     //     $("#main_navbar").hide();
        //     //     $(".page_bn").hide();
        //     //     $("#toTop").show();
        //     //     $(this).css("padding-bottom",100)
        //     // } else {
        //     //     $("#main_navbar").show();
        //     //     $(".page_bn").show();
        //     //     $("#toTop").hide();
        //     //     $(this).css("padding-bottom",50)
        //     // }
        // });
        $DB.on("click", "#btn_pass", function(e) {
            //用户输入密码
            var psw = $("#passwd").val();
            var load = $('<div id="loadingToast" style=" display: none;">\
                                        <div class="weui-mask_transparent"></div>\
                                        <div class="weui-toast">\
                                            <i class="weui-loading weui-icon_toast"></i>\
                                            <p class="weui-toast__content">数据加载中</p>\
                                        </div>\
                                    </div>');
            var err = $('<div id="loadingToast" style=" display: none;">\
                                        <div class="weui-mask_transparent"></div>\
                                        <div class="weui-toast">\
                                            <i class="weui-loading weui-icon_toast"></i>\
                                            <p class="weui-toast__content">密码错误！</p>\
                                        </div>\
                                    </div>');
            if (psw == that.bkblInfo.pass) {
                //继续加载
                //把PASSWD加入缓存
                localStorage.setItem("homePW", psw);
                localStorage.setItem("homePW_time", +new Date());
                PW = psw;
                $("#passwdBd").append(load);
                load.fadeIn(100);
                setTimeout(function() {
                    load.fadeOut(100);
                    $("#passwdBd").remove();
                }, 1000);
                that.init_part(that.bkblInfo);
            } else {
                $("#passwdBd").append(err);
                err.fadeIn(100);
                setTimeout(function() {
                    err.fadeOut(100);
                }, 1000);
            }
        });

    };
    this.weixin = {
        record: {
            stop: function(opt) {
                // 停止录音接口
                var $opt = opt || {},
                    fun = $opt.fun;
                wx.stopRecord({
                    success: function(res) {
                        localId = res.localId;
                        fun({ id: localId });
                    }
                });
            },
            upload: function(opt) {
                // 上传语音接口
                var $opt = opt || {},
                    id = $opt.id;
                wx.uploadVoice({
                    localId: id, // 需要上传的音频的本地ID，由stopRecord接口获得 、、
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function(res) {
                        var serverId = res.serverId; // 返回音频的服务器端ID wxLocalResource://515409184208210
                        //确认发布
                        that.ele.dialog = that.dom_dialog({
                            msg: "确认提交录音？",
                            fun: function() {
                                var d = { type: 2, msg: serverId };
                                if (reId == 0) {
                                    that.send_words(d);
                                } else {
                                    that.send_repo(d);
                                }
                            }
                        });
                        $DB.append(that.ele.mask);
                        $DB.append(that.ele.dialog);
                    }
                })
            },
            download: function(opt) {
                // 下载语音接口
                var $opt = opt || {},
                    id = $opt.id,
                    fun = $opt.fun;
                wx.downloadVoice({
                    serverId: id, // 需要下载的音频的服务器端ID，由uploadVoice接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function(res) {
                        var localId = res.localId; // 返回音频的本地ID
                        fun(localId);
                    }
                });
            }
        },
        img: {
            upload: function(opt) {
                var $opt = opt || {},
                    id = $opt.id,
                    fun = $opt.fun || function() {};
                wx.uploadImage({
                    localId: id, // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function(res) {
                        var serverId = res.serverId; // 返回图片的服务器端ID
                        fun(serverId);
                    }
                });
            },
            choose: function(opt) {
                var $opt = opt || {},
                    fun = $opt.fun || function() {};
                wx.chooseImage({
                    count: 1, // 默认9
                    success: function(res) {
                        var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                        fun(localIds);
                    }
                });
            },
            download: function(opt) {
                var $opt = opt || {},
                    id = $opt.id,
                    fun = $opt.fun || function() {},
                    fun2 = $opt.fun2 || function() {};
                wx.downloadImage({
                    serverId: id, // 需要下载的图片的服务器端ID，由uploadImage接口获得
                    isShowProgressTips: 0, // 默认为1，显示进度提示
                    success: function(res) {
                        var localId = res.localId; // 返回图片下载后的本地ID
                        fun(localId);
                    },
                    complete: function(res) {
                        var localId2 = res.localId;
                        fun2(localId2)
                    }
                });
            }
        }
    }
    this.dom_chatLine = function(opt) {
        var $opt = opt || {},
            head = $opt.head,
            nickname = $opt.nickname,
            _message = $opt.message || "",
            message = (_message.split("|").length == 1) ? _message : _message.split(".,")[1],
            rType = $opt.rtype || "", //留言格式 0：文字 1：图片 2：语音
            type = $opt.type || "",
            video = $opt.video || "",
            image = $opt.image || "",
            date = $opt.date,
            top = $opt.top || "",
            id = $opt.id,
            province = $opt.province || "",
            uid = $opt.uid,
            repo = $opt.comment || "",
            retort = $opt.retort || "",
            owner = (that.data.uid == uid) ? true : false,
            display = (owner) ? "inline-block" : "none",
            html_top = (top) ? '<span class="weui-badge badge-top">置顶</span>' : "",
            html_repo = (repo) ? that.dom_repo(repo, id, nickname)[1] : "",
            html_retort = (retort) ? that.dom_retort(retort)[1] : "",
            has_retort = (that.dom_retort(retort)[2].length == 0) ? 0 : that.dom_retort(retort)[2],
            dataType = { id: id, uid: "", type: "speak", retort: has_retort },
            html_message = "";
        switch (parseInt(rType)) {
            case 1:
                //图片
                var id = _message.split("|")[1],
                    text = _message.split("|")[0],
                    img_html = "";
                // for (var i = 0; i < arr.length; i++) {
                //     var id = arr[i];
                //     // wximgArr.push(id);
                //     img_html += '<img src="http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=' + atoken + '&media_id=' + id + '" class="btn_preview"  onerror="imgError(this,\'./img/overtime.png\',{width:80,height:40})">';
                // };
                if ($opt.fstatus == "0") {
                    img_html += '<p class="weui-media-box__desc"><img src="http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=' + atoken + '&media_id=' + id + '" class="btn_preview"  onerror="imgError(this,\'./img/overtime.png\',{width:80,height:40})"></p>';
                } else {
                    img_html += '<p class="weui-media-box__desc"><img src="' + $opt.path + '" class="btn_preview"  onerror="imgError(this,\'./img/overtime.png\',{width:80,height:40})"></p>';
                }
                textHtml = '<p class="weui-media-box__desc">' + html_top + text + '</p>'
                html_message = textHtml + img_html;
                break;
            case 2:
                //语音z_init.audio_t(this)
                if ($opt.fstatus == "0") {
                    html_message = '<p class="weui-media-box__desc">' + html_top + '<a class="btn_playRecord" dataType="' + message + '"><i class="audioIcon"><img src="./img/audio.png"></i><i class="audioPlaying" style="display:none"></i><span class="s-arrow"></span></a></p>';
                } else {
                    html_message = '<p class="weui-media-box__desc">' + html_top + '<audio src="' + $opt.path + '" style="width:40px;height:20px" onended="z_init.audio_stop(this)" onpause="z_init.audio_stop(this)" onplay="z_init.audio_play(this)"></audio><a class="btn_playRecord2" dataType="' + message + '"><i class="audioIcon"><img src="./img/audio.png"></i><i class="audioPlaying" style="display:none"></i><span class="voiceTime"></span><span class="s-arrow"></span></a></p>';
                    // html_message = '<p class="weui-media-box__desc">' + html_top + '<audio src="' + $opt.path + '" controls="controls" preload="auto" onCanplay="z_init.audio_t(this)"></audio></p>';
                }
                break;
            case 0:
                //文字
                html_message = '<p class="weui-media-box__desc  btn_chatMsg">' + html_top + decodeURIComponent(message) + '</p>';
                break;
        };
        //判断主持发言类型
        switch (parseInt(type)) {
            case 1:
                var imgHtml = "";
                if (image) {
                    imgHtml = '<p class="weui-media-box__desc  btn_chatMsg"><img src="' + image + '" class="btn_preview" onerror="imgError(this,\'./img/overtime.png\',{width:80,height:40})"></p>'
                }
                html_message += '<p class="weui-media-box__desc  btn_chatMsg">' + html_top + decodeURIComponent(message) + '</p>' + imgHtml;
                break;
            case 3:
                //视频
                html_message += '<p class="weui-media-box__desc  btn_chatMsg">' + html_top + decodeURIComponent(message) + '</p><div class="viewType" ><div class="viewBox"><img src="' + image + '" style="height:200px;max-width:100%" onerror="imgError(this)"><span class="btn_playView" dataType="' + video + ' "><i class="iconfont icon-bofang1"></i></span></div></div>';
                break;
            case 4:
                //链接
                html_message += '<p class="weui-media-box__desc  btn_chatMsg">' + html_top + decodeURIComponent(message) + '</p><div class="viewType"><a href="' + video + '"><i class="iconfont icon-lianjie"></i>' + image + '</a></div>';
                break;
            default:
                break;
        };
        var html = '<div class="weui-media-box weui-media-box_appmsg weui-media-box_appmsg_1" dataType="' + encodeURIComponent(JSON.stringify(dataType)) + '">\
                                <div class="weui-media-box__hd">\
                                    <img class="weui-media-box__thumb" src="' + head + '" alt="">\
                                </div>\
                                <div class="weui-media-box__bd">\
                                    <span class="rep_city">' + province + '</span>\
                                    <h4 class="weui-media-box__title">' + nickname + '</h4>\
                                    ' + html_message + '\
                                    <div class="rep_info">\
                                        <p class="rep_time">' + date + '</p>\
                                        <a class="rep_del" style="display:' + display + '">删除</a>\
                                        <div class="rep_tag btn_getTools"><i class="iconfont icon-gengduo"></i></div>\
                                    </div>\
                                    ' + html_retort + html_repo + '\
                                </div>\
                            </div>',
            $html = $(html);
        lastId = $opt.id;
        return $(html)[0];
    };
    //加载partDOM
    this.init_part = function(opt) {
        var d = opt;
        that.get_broadList();
        if (d.model == 2) {
            //幻灯片
            var source = d.source,
                html = '<div class="swiper-container2"><div class="swiper-wrapper">',
                script = "";
            for (var i = 0; i < source.length; i++) {
                var s = source[i],
                    url = (s.url == "") ? "" : "href='" + s.url + "'",
                    img = s.image;
                html += '<div class="swiper-slide"><a class="swiper2-slide-a" ' + url + '><img src="' + img + '""></a></div>';
            }
            html += '</div></div>';

            var script = '<script>\
                                   var mySwiper2 = new Swiper(".swiper-container2", {\
                                                        autoplay: 5000,\
                                                    });\
                                </script>';
            $("#video").html(html + script);
        } else {
            //视频
            $("#video").html('<img src="' + d.image + '" style="height:100%;margin: 0 auto;display: block;"><span id="btn_playVideo"><i class="iconfont icon-bofang1"></i></span>');
        };
        //导航栏,加载顺序
        var h = "",
            w = "",
            c = '<a class="weui-navbar__item" dataType="chat">聊天</a>',
            cBox = $("#chatBox");
        cBox.html("").append(that.ele.nowLoding);
        $(that.ele.speak).remove();
        if (d.subject == 1) {
            h = '<a class="weui-navbar__item weui-bar__item_on" dataType="host">主持</a>';
            that.get_presideList();
            if (d.special == 1) {
                w = '<a class="weui-navbar__item" dataType="wonder">精彩</a>';
            }
        } else {
            if (d.special == 1) {
                w = '<a class="weui-navbar__item weui-bar__item_on" dataType="wonder">精彩</a>';
                // wBox.show();
                that.get_wonderList()
            } else {
                c = '<a class="weui-navbar__item  weui-bar__item_on" dataType="chat">聊天</a>';
                if (that.bkblInfo.sright != 3) {
                    // sright: 发言权限 1 都可以 2 需审核 3 都不可
                    $(".page").append(that.ele.speak);
                }
                that.get_chatList();
            }
        };
        $("#main_navbar").html(h + w + c);
        //发起socket链接
        if (!ws.hasInit) {
                        ws.send('{"talk_id":"' + TID + '","cmdtype":"login","xopenid":"'+XID+'","author":"'+AU+'","from":"wxchatxiaomai","to":"xiaomaiserver","data":""}');

            ws.send('{"talk_id":"' + TID + '","cmdtype":"getchatinfo","from":"wxchatxiaomai","to":"wxchatxiaomai","rtype":0}');

            ws.hasInit = true;
        }
    };
    //回复dom
    this.dom_repo = function(opt, id, name) {
        var $opt = opt || {},
            $id = id || "",
            $name = name || "",
            $opt = $opt.list || [],
            html = "",
            html_repo = '<div class="rep_item">';
        for (var i = 0; i < $opt.length; i++) {
            var head = $opt[i].head,
                nickname = $opt[i].nickname,
                rnickname = $opt[i].rnickname || "",
                uid = $opt[i].uid || "",
                id = $opt[i].id || 0,
                message = $opt[i].message,
                display = (uid == that.data.uid) ? "inline-block" : "none",
                dataType = { id: id, uid: uid, type: "repo", _id: $id, _name: $name, pid: id, },
                rname = "";
            if (rnickname) {
                rname = ' <span style="margin-right: 0.2em;color: #999;font-weight: 400;display:inline-block;margin-left: -0.2em;">回复' + rnickname + ':</span>';
            }
            html_repo += ' <div class="weui-media-box weui-media-box_appmsg" dataType="' + encodeURIComponent(JSON.stringify(dataType)) + '">\
                                <div class="weui-media-box__hd">\
                                    <img class="weui-media-box__thumb" src="' + head + '" alt="">\
                                </div>\
                                <div class="weui-media-box__bd btn_reComment">\
                                    <h4 class="weui-media-box__title">' + nickname + '<a class="rep_del" style="margin-left:10px;color:#999;font-weight:400;display:' + display + '">删除</a>\</h4>\
                                    <p class="weui-media-box__desc">' + rname + decodeURIComponent(message) + '</p>\
                                </div>\
                             </div>';
        }
        html_repo += "</div>";
        html = '<div class="rep_box rep_box_repo"><div class="rep_tag"><i class="iconfont icon-pinglun"></i></div>' + html_repo + '</div>';
        var $html = $(html);
        return [$html[0], html];
    };
    //点赞dom
    this.dom_retort = function(opt) {
        var $opt = opt.list || [],
            html_img = "",
            retort = false,
            html_id = "",
            arr = [];
        for (var i = 0; i < $opt.length; i++) {
            var head = $opt[i].head;
            if (that.data.uid == $opt[i].uid) {
                retort = true;
                arr.push($opt[i].id);
                html_id = "retort_" + $opt[i].id;
            }
            html_img += '<img class="rep_head" src="' + head + '" id="' + html_id + '">';
        }
        var html = '<div class="rep_box rep_box_retort">\
                            <div class="rep_tag">\
                                <i class="iconfont icon-xihuan"></i>\
                            </div>\
                            <div class="rep_item" style="padding:4px 4px 0;">' + html_img + '</div>\
                    </div>';
        var $html = $(html);
        return [$html[0], html, arr]; //[元素，html字符，已赞]
    };
    //发言框
    this.dom_comment = function(opt) {
        var $opt = opt || {},
            html,
            type = $opt.type || "",
            style = (type == "repo") ? ('style="display:none"') : "";
        html = '<div class="page" style="display:none">\
                        <div class="comment">\
                            <div class="weui-cell" ' + style + '>\
                                <div class="weui-cell__bd" > \
                                    <div class="weui-uploader__bd">\
                                        <ul class="weui-uploader__files" id="uploaderFiles">\
                                        </ul>\
                                    </div>\
                                </div>\
                            </div>\
                            <div class="weui-cells weui-cells_form">\
                                <div class="weui-cell">\
                                    <div class="weui-cell__bd">\
                                        <textarea class="weui-textarea" placeholder="这一刻你想说的。。" rows="3" id="emoji"></textarea>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                        <div class="weui-navbar comment_nav" ' + style + '>\
                            <div class="weui-navbar__item" id="btn_voice">\
                                <i class="iconfont icon-changge"></i>语音\
                            </div>\
                            <div class="weui-navbar__item" id="btn_picture">\
                                <i class="iconfont icon-paizhao"></i>照片\
                            </div>\
                        </div>\
                        <div class="comment_btnBox">\
                            <a href="javascript:;" class="weui-btn weui-btn_primary" id="btn_send">发布</a>\
                            <a href="javascript:;" class="weui-btn weui-btn_default" id="btn_commentBack">返回</a>\
                        </div>\
                    </div>';
        var $html = $(html);
        $emoji = $html.find("#emoji");
        that.ele.emoji = $emoji[0];
        //Video最小化，防止微信端video层级最上层BUG
        that.toggle_video(1);
        return $html[0];
    };
    //提示框
    this.dom_dialog = function(opt) {
        var $opt = opt || {},
            msg = $opt.msg || "确定要删除发言吗？",
            fun = $opt.fun || function() {};
        var html = '<div class="weui-dialog">\
                        <div class="weui-dialog__hd"><i class="weui-icon-warn weui-icon_msg-primary" style="font-size: 80px;margin-bottom: 12px;"></i></div>\
                        <div class="weui-dialog__bd">' + msg + '</div>\
                        <div class="weui-dialog__ft">\
                            <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" id="dialog_false">取消</a>\
                            <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" id="dialog_true">确定</a>\
                        </div>\
                    </div>';
        var $html = $(html);
        var f = $html.find("#dialog_false"),
            t = $html.find("#dialog_true");
        f.on("click", function() {
            close();
        });
        t.on("click", function() {
            close();
            fun();
        });
        return $html[0];
    };
    //预览图
    this.dom_preview = function(opt) {
        var $opt = opt || {},
            src = $opt.src,
            style = $opt.style || "";
        var html = '<div class="weui-gallery" style="display:block">\
                        <span class="weui-gallery__img" id="previewImg" style="background-image:url(' + src + ')"></span>\
                        <div class="weui-gallery__opr">\
                            <a href="javascript:" class="weui-gallery__del" id="btn_delImg" ' + style + '>\
                                <i class="weui-icon-delete weui-icon_gallery-delete"></i>\
                            </a>\
                        </div>\
                    </div>',
            $html = $(html);
        return $html[0];
    };
    this.dom_wonderList = function(opt) {
        var $opt = opt || {},
            html = '<div>';
        for (var i = 0; i < $opt.length; i++) {
            var _opt = $opt[i],
                id = _opt.id,
                img = _opt.image,
                title = _opt.title,
                msg = _opt.message || "无简介",
                date = _opt.date || "",
                top = _opt.top,
                retort = (_opt.retort) ? _opt.retort.total : 0,
                comment = (_opt.comment) ? _opt.comment.total : 0,
                topHtml = top ? '<span class="weui-badge badge-top">置顶</span>' : "";
            html += '<div class="weui-cell btn_wonder" dataType=\'' + JSON.stringify(_opt) + '\'>\
                        <div class="weui-cell__hd" style="margin-right:8px;height:50px;"><img src="' + img + '"  onerror="imgError(this,\'./img/nopic2.jpg\')" style="width: 80px;height:50px;"></div>\
                        <div class="weui-cell__bd">\
                            <p class="wonder_p">' + topHtml + title + '</p>\
                            <p style="font-size: 12px;color: #888;text-indent:0.2em">' + date + '</p>\
                        </div>\
                        <div class="weui-cell__ft "><a class="btn_wonderRet"><i class="iconfont icon-xihuan"></i><span>' + retort + '</span></a></div>\
                    </div>';

        }
        html += "</div>";
        return [$(html)[0], html];
    };
    //播报dom
    this.dom_broad = function(opt) {
        var $opt = opt || {},
            title = $opt.title,
            img = $opt.image,
            url = $opt.url;
        var html = '<div class="page" style="display:none" id="btn_broadBd">\
                    <div class="page__bd">\
                            <article class="weui-article" style="padding-top:20px;">\
                                    <section>\
                                       <p style="text-align:center"> ' + title + '</p>\
                                       <h3 style="text-align:right"><a style="float:left;color:#1b5e94">返回</a><a style="color:#1b5e94" href="' + url + '">点击跳转</a></h3>\
                                        <p style="text-align:center">\
                                           <img src="' + img + '" alt="">\
                                        </p>\
                                    </section>\
                            </article>\
                        </div>\
                    </div>';
        var $html = $(html);
        return [$html[0], html];
    };
    //精彩DOM 
    this.dom_wonder = function(opt) {
        var $opt = opt || {},
            title = $opt.title,
            video = $opt.video,
            message = $opt.message,
            img = $opt.image,
            date = $opt.date,
            url = $opt.url,
            comment = $opt.comment,
            ct = ($opt.comment) ? $opt.comment.total : "0",
            rt = ($opt.retort) ? $opt.retort.total : "0",
            f = $('<div></div>');
        if (comment != "") {
            for (var i = 0; i < comment.list.length; i++) {
                var d = comment.list[i];
                f.append(that.dom_chatLine(d));
            }
            comment = f.html();
        } else {
            comment = '<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无评论</span></div>';
        }
        var html = '<div class="page" style="display:none" id="wonderBd">\
                    <div class="page__bd">\
                            <div id="wonderVideo" class="viewType"><img src="' + img + '" alt="" style="width:100%" onerror="imgError(this,\'./img/nopic2.jpg\')">\
                            <span class="btn_playView" dataType="' + video + '"><i class="iconfont icon-bofang1"></i></span></div>\
                            <article class="weui-article">\
                                    <section>\
                                        <section style=" border-bottom: 1px  groove #ddd;">\
                                            <h2 style="overflow:hidden">标题：' + title + '<a href="javascript:;" id="wonderBack">返回</a></h2>\
                                            <h3>' + date + ' <i class="iconfont icon-xihuan ">' + rt + '</i><i class="iconfont icon-pinglun">' + ct + '</i></h3>\
                                            <p id="wonderMsg" class="btn_chatMsg">简介：' + message + '</p>\
                                        </section>\
                                        <section>\
                                            <h3>留言板：</h3>\
                                            <div style="zoom:0.8" id="wonderChat">' + comment + '</div>\
                                        </section>\
                                    </section>\
                            </article>\
                        </div>\
                    </div>';
        var $html = $(html);
        that.toggle_video(1);
        return [$html[0], html];
    };
    //密码DOM
    this.passwd_dom = function(opt) {
        var html = '<div class="page"  id="passwdBd">\
                    <div class="weui-mask"></div>\
                    <div class="weui-dialog">\
                        <div class="weui-dialog__hd"><strong class="weui-dialog__title">请输入房间密码</strong></div>\
                        <div class="weui-dialog__bd" ><input class="weui-input" type="text" placeholder="请输入密码" style="padding:6px 2px;border:1px solid #ccc" id="passwd"></div>\
                        <div class="weui-dialog__ft">\
                            <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" id="btn_pass">确认</a>\
                        </div>\
                </div></div>';
        return [$(html)[0], html];
    };
    //刷新聊天列表
    this.refresh_chat = function(opt) {
        var $opt = opt || {};
        for (var i = 0; i < $opt.length; i++) {
            $("#chatBox").append(that.dom_chatLine($opt[i]));
        };
        //移动端加载音频
        // if ($("audio").length > 0) {
        //     var audio = $("audio");
        //     for (var i = 0; i < audio.length; i++) {
        //         var ele = audio.eq(i)[0];
        //         ele.load();
        //         alert("从新加载")
        //     }
        // }
    };
    //获取用户信息
    this.get_userInfo = function() {
        var data = that.data;
        invoke({
            data: {
                m: params.userInfo,
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(d) {
                var $d = d;
                $.extend(true, that.data, $d);
                that.get_bkbl();
            }
        });
    };
    //获取BKBL信息
    this.get_bkbl = function() {
        var data = that.data;
        invoke({
            data: {
                m: params.bkbl,
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(d) {
                that.bkblInfo = d;
                // id:记录ID
                // model: 嵌入类型  1 直播流 2 幻灯片 3 URL
                // autoplay: 自动播放 1 否 2 是
                // replay: 重播方式 1 不重播 2 循环重播 3 延迟播放
                // screen: 社区锁屏 1 否 2 全屏 3 半屏
                // resolut: 视频比例 1 16:9 2 4:3
                // sright: 发言权限 1 都可以 2 需审核 3 都不可
                // cright: 评论权限 1 都可以 2 需审核 3 都不可
                // pass: 访问密码
                // source: 直播流
                // image: 主题图片
                // title:标题
                // special:"0"精彩0关、1开
                // subject:"1"主持
                if (!that.hasCount) {
                    that.count({ type: 1 });
                    that.hasCount = true;
                }
                that.checkPW(d);
            }
        });
    };
    this.checkPW = function(opt) {
        var d = opt || {};
        if (d.pass) {
            if (d.pass == PW) {
                //密码等于缓存密码
                var tlimite = 60 * 60 * 24 * 1000; //24小时
                var nowT = +new Date();
                if (nowT - parseInt(PWT) < tlimite) {
                    //未超过缓存时限
                    that.init_part(d);
                    return
                };
            };
            var pdom = that.passwd_dom();
            $DB.append(pdom[0]);
            return
        } else {
            that.init_part(d);
        }
    };
    //获取主持列表
    this.get_presideList = function(opt) {
        var $opt = opt || {},
            id = $opt.id || 0,
            num = $opt.num || 5,
            data = {
                talk_id: that.data.talk_id,
                xopenid: that.data.xopenid,
                author: that.data.author
            };
        data.id = id;
        data.num = num;
        data.m = params.presideList;
        data.top = top;
        invoke({
            url: "",
            data: data,
            fun: function(d) {
                // WSnum.host = NUM.subject;
                var badge = $("#main_navbar a[dataType='host']").find("span");
                if (typeOf(badge[0]) == "dom") {
                    var res = badge.html();
                    console.log(res);
                    WSnum.host = parseInt(WSnum.host) + parseInt(res);
                }
                badge.remove();

                if (d) {
                    //存在
                    that.refresh_chat(d);
                    if (d.length >= num) {
                        //显示加载更多
                        $("#chatBox").append('<a href="javascript:;" class="weui-btn weui-btn_default " id="btn_more">加载更多</a>')
                        $(that.ele.nowLoding).remove();
                        return
                    } else {
                        //继续执行
                        if (top == "") {
                            //显示暂无数据
                            var btn = $("#btn_more")[0];
                            if (typeOf(btn) == "dom") {
                                $(btn).remove();
                            }
                            $("#chatBox").append('<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无数据</span></div>');
                            $(that.ele.nowLoding).remove();
                            return
                        } else {
                            top = "";
                            data.num = num - d.length;
                            data.id = "0";
                            that.get_presideList(data);
                        }

                    }
                } else {
                    if (top) {
                        //置顶页面查询完接着查不置顶的
                        // that.refresh_chat(d);
                        top = "";
                        data.num = num;
                        data.id = "0";
                        that.get_presideList(data);
                        //继续执行请求
                    } else {
                        //结束
                        var btn = $("#btn_more")[0];
                        if (typeOf(btn) == "dom") {
                            $(btn).remove();
                        }
                        $("#chatBox").append('<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无数据</span></div>');
                        $(that.ele.nowLoding).remove();
                        return
                    }
                }

            }
        })
    };
    //获取聊天列表
    this.get_chatList = function(opt) {
        var $opt = opt || {},
            id = $opt.id || 0,
            num = $opt.num || 5,
            data = {
                talk_id: that.data.talk_id,
                xopenid: that.data.xopenid,
                author: that.data.author
            };
        data.id = id;
        data.num = num;
        data.m = params.chatList;
        data.top = top;
        invoke({
            url: "",
            data: data,
            fun: function(d) {
                //清零socket计数，删除badge;
                // WSnum.chat = NUM.chatroom;
                var badge = $("#main_navbar a[dataType='chat']").find("span");
                if (typeOf(badge[0]) == "dom") {
                    var res = badge.html();
                    console.log(res);
                    WSnum.chat = parseInt(WSnum.chat) + parseInt(res);
                }
                badge.remove();

                if (d) {
                    //存在
                    that.refresh_chat(d);
                    if (d.length >= num) {
                        //显示加载更多
                        $("#chatBox").append('<a href="javascript:;" class="weui-btn weui-btn_default " id="btn_more">加载更多</a>')
                        $(that.ele.nowLoding).remove();

                        return
                    } else {
                        //继续执行
                        if (top == "") {
                            //显示暂无数据
                            var btn = $("#btn_more")[0];
                            if (typeOf(btn) == "dom") {
                                $(btn).remove();
                            }
                            $("#chatBox").append('<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无数据</span></div>');
                            $(that.ele.nowLoding).remove();

                            return
                        } else {
                            top = "";
                            data.num = num - d.length;
                            data.id = "0";
                            that.get_chatList(data);
                        }
                    }
                } else {
                    if (top) {
                        //置顶页面查询完接着查不置顶的
                        top = "";
                        data.num = num;
                        data.id = "0";
                        that.get_chatList(data);
                        //继续执行请求
                    } else {
                        //结束
                        var btn = $("#btn_more")[0];
                        if (typeOf(btn) == "dom") {
                            $(btn).remove();
                        }
                        $("#chatBox").append('<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无数据</span></div>');
                        $(that.ele.nowLoding).remove();

                        return
                    }
                }


            }
        })
    };
    //获取播报
    this.get_broadList = function(opt) {
        var data = that.data;
        var styleHtml = "<script>var mySwiper = new Swiper('.swiper-container', {autoplay: 5000,});</script>";
        invoke({
            data: {
                m: params.broadList,
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(d) {
                var bn = "";
                for (var i = 0; i < d.length; i++) {
                    var $d = d[i],
                        img = $d.image,
                        title = $d.title,
                        url = ($d.url == "") ? "" : "href='" + $d.url + "'";
                    bn += '<div class="swiper-slide"><div class="swiper-slide-a" style="background-image: url(' + img + ')" dataType="' + encodeURIComponent(JSON.stringify($d)) + '"><a ' + url + '></a></div></div>';
                }
                var html = '<div class="swiper-container"><div class="swiper-wrapper">' + bn + '</div></div>' + styleHtml;
                $(".page_bn").html(html);
            },
            err: function(d) {
                var html = '  <div class="swiper-container">\
                                <div class="swiper-wrapper">\
                                    <div class="swiper-slide"><a class="swiper-slide-a"></a></div>\
                                </div>\
                            </div>' + styleHtml;
                $(".page_bn").html(html);
            }
        })
    };
    //获取精彩列表
    this.get_wonderList = function(opt) {
        var $opt = opt || {},
            page = $opt.page || 1;
        var data = {
            m: params.wonderList,
            type: 1,
            num: 6,
            page: page,
            talk_id: that.data.talk_id,
            xopenid: that.data.xopenid,
            author: that.data.author
        };
        invoke({
            data: data,
            fun: function(d) {
                // WSnum.wonder = NUM.special;
                var badge = $("#main_navbar a[dataType='wonder']").find("span");
                if (typeOf(badge[0]) == "dom") {
                    var res = badge.html();
                    console.log(res);
                    WSnum.wonder = parseInt(WSnum.wonder) + parseInt(res);
                }
                badge.remove();
                $(that.ele.nowLoding).remove();
                var ele = that.dom_wonderList(d.list),
                    t = Math.ceil(d.total / 6),
                    c = d.curr;
                if (typeOf($("#wonder")[0]) == "dom") {

                    $("#chatBox").append(ele[0])
                } else {
                    var html = '<div class="weui-cells" id="wonder">' + ele[1] + "</div>";
                    $("#chatBox").html(html);
                }
                if (t != c) {
                    $("#chatBox").append('<a class="weui-btn weui-btn_default " id="btn_more">加载更多</a>');
                } else {
                    $("#chatBox").append('<div class="weui-loadmore weui-loadmore_line"><span class="weui-loadmore__tips">暂无数据</span></div>');
                }
            }
        });
    };
    //删除留言
    this.del_chat = function(opt) {
        var $opt = opt || {},
            id = $opt.id,
            type = $opt.type,
            data = that.data,
            m;
        switch (part) {
            case "host":
                m = params.presideDelRepo;
                break;
            case "wonder":
                m = params.wonderDelRepo;
                break;
            case "chat":
                m = (type == "speak") ? params.delSpeak : params.delRepo;
                break;
        }
        invoke({
            data: {
                m: m,
                id: id,
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(data) {
                if (reEle.siblings().length == 0) {
                    reEle.closest('.rep_box_repo').fadeOut(function() {
                        this.remove()
                    });
                }
                reEle.fadeOut(function() {
                    this.remove()
                });
            }
        });
    };
    //留言
    this.send_words = function(opt) {
        var words = that.ele.emoji.value,
            data = that.data,
            $opt = opt || {},
            type = $opt.type || 0,
            msg = "";
        // if (!that.send_check(msg)) {
        //     return;
        // }
        // if (type == 1 && imgArr.length > 3) {
        //     alert("最多三张图");
        //     return
        // }
        if (words.indexOf("|") != -1) {
            alert("不要出现特殊字符");
            return
        }

        switch (type) {
            case 1:
                //图片
                msg = words + "|" + $opt.msg;
                break;
            case 2:
                msg = $opt.msg;
                break;
            default:
                msg = words;
                break;
        }

        if (!that.send_check(msg)) {
            return;
        }
        invoke({
            data: {
                m: params.chatSpeak,
                message: msg,
                type: type,
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(d) {
                WSnum.chat = parseInt(WSnum.chat) + 1;
                var $d = d,
                    data = that.data;
                data.id = $d;
                data.message = msg;
                data.rtype = type || "0";
                data.fstatus = "0";
                data.date = "刚刚";
                $("#chatBox").prepend(that.dom_chatLine(data));
                $(that.ele.comment).remove();
                that.toggle_video();
                ws.send('{"talk_id":"' + TID + '","cmdtype":"getchatinfo","from":"wxchatxiaomai","to":"wxchatxiaomai","rtype":1}');
                that.count({ type: 3 })
            }
        });
    };
    //回复留言
    this.send_repo = function(opt) {
        var words = that.ele.emoji.value,
            mp = { host: params.presideRepo, chat: params.chatRepo },
            data = that.data,
            $opt = opt || {},
            type = $opt.type || "",
            msg = $opt.msg || words,
            cid = reId._id || reId.id,
            pid = reId.uid,
            m = mp[part];
        if (!that.send_check(msg)) {
            return;
        }
        invoke({
            data: {
                m: m,
                message: msg, //目前先只能文字
                cid: cid, //被回复聊天记录ID
                pid: pid, //被回复的用户ID
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(_) {
                var d = reEle.find(".rep_box_repo");
                that.count({ type: 2 })
                if (typeOf(d[0]) == "dom") {
                    //存在回复框
                    var head = data.head,
                        nickname = data.nickname,
                        message = msg,
                        html_repo = ' <div class="weui-media-box weui-media-box_appmsg"">\
                                            <div class="weui-media-box__hd">\
                                                <img class="weui-media-box__thumb" src="' + head + '" alt="">\
                                            </div>\
                                            <div class="weui-media-box__bd">\
                                                <h4 class="weui-media-box__title">' + nickname + '</h4>\
                                                <p class="weui-media-box__desc">' + decodeURIComponent(message) + '</p>\
                                            </div>\
                                       </div>';
                    d.find(".rep_item").prepend(html_repo);
                } else if (reId._id) {
                    //回复评论中的回复
                    var head = data.head,
                        nickname = data.nickname,
                        message = msg,
                        html_repo = ' <div class="weui-media-box weui-media-box_appmsg"">\
                                            <div class="weui-media-box__hd">\
                                                <img class="weui-media-box__thumb" src="' + head + '" alt="">\
                                            </div>\
                                            <div class="weui-media-box__bd">\
                                                <h4 class="weui-media-box__title">' + nickname + '</h4>\
                                                <p class="weui-media-box__desc">' + decodeURIComponent(message) + '</p>\
                                            </div>\
                                       </div>';
                    reEle.after(html_repo);
                } else {
                    //不存在 创建
                    var info = {
                        list: [{
                            head: data.head,
                            nickname: data.nickname,
                            message: msg
                        }]
                    }
                    var dom_repo = that.dom_repo(info)[0];
                    reEle.find(".weui-media-box__bd").append(dom_repo);
                }

                $(that.ele.comment).slideDown('fast', function() {
                    that.toggle_video();
                }).remove();
            }
        });
    };
    //回复精彩
    this.send_wonder = function() {
        //   参数：m:      接口ID 7255 wonderRepo
        // message:发言内容
        // cid:    被回复发言记录ID
        // pid:    被回复的用户ID
        // talk_id:边看边聊ID
        // xopenid:前台微信用户ID(前台)
        // author:登录检查参数(前台)
        var msg = that.ele.emoji.value,
            data = {
                message: msg,
                m: params.wonderRepo,
                cid: wonderdt.id,
                pid: "",
                talk_id: that.data.talk_id,
                xopenid: that.data.xopenid,
                author: that.data.author
            };
        if (!that.send_check(msg)) {
            return;
        }
        invoke({
            data: data,
            fun: function(d) {
                that.count({ type: 2 })
                $(that.ele.comment).slideDown('fast').remove();
                that.toggle_video();
                var _data = { head: that.data.head, nickname: that.data.nickname, date: "刚刚", message: msg };
                var ele = that.dom_chatLine(_data);
                console.log(ele);
                $("#wonderChat").prepend(ele);
            }
        })
    };
    //点赞
    this.send_retort = function() {
        var data = that.data,
            mp = { host: params.presideRetort, chat: params.chatRetort },
            cid = reId.id,
            m = mp[part];
        invoke({
            data: {
                m: m,
                cid: cid, //被回复聊天记录ID
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function(_) {
                that.count({ type: 4 })
                var d = reEle.find(".rep_box_retort"),
                    id = _,
                    head = that.data.head;
                //添加点赞数组
                var dataType = reEle.attr("dataType");
                dataType = JSON.parse(decodeURIComponent(dataType));
                dataType.retort = [id];
                dataType = encodeURIComponent(JSON.stringify(dataType));
                reEle.attr("dataType", dataType);
                if (typeOf(d[0]) == "dom") {
                    //存在点赞框 +1赞
                    d.find(".rep_item").prepend('<img class="rep_head" src="' + head + '" id="retort_' + id + '">');
                } else {
                    //创建点赞框
                    var s = {
                        list: [{
                            head: that.data.head,
                            uid: that.data.uid,
                            id: id
                        }]
                    }
                    reEle.find(".rep_info").after(that.dom_retort(s)[0]);
                };
            }
        });
    };
    //取消点赞
    this.del_retort = function() {
        var data = that.data,
            mp = { host: params.presideDelReto, chat: params.delRetort },
            m = mp[part],
            id = reId.id,
            rid = reId.retort[0];
        console.log(reId);
        invoke({
            data: {
                m: m,
                id: id, //被回复聊天记录ID
                talk_id: data.talk_id,
                xopenid: data.xopenid,
                author: data.author
            },
            fun: function() {
                //取消点赞数组
                var dataType = reEle.attr("dataType");
                dataType = JSON.parse(decodeURIComponent(dataType));
                dataType.retort = 0;
                dataType = encodeURIComponent(JSON.stringify(dataType));
                reEle.attr("dataType", dataType);
                var idNum = "#retort_" + rid,
                    $ele = $('' + idNum + ''),
                    $pEle = $ele.closest('.rep_box_retort');
                $ele.fadeOut(function() {
                    this.remove()
                });
                if ($ele.siblings().length == 0) {
                    $pEle.fadeOut(function() { this.remove() })
                }
            }
        });
    };
    //获取服务器图片
    this.getImg = function(x, arr) {
        var $arr = arr || wximgArr,
            $i = x,
            _i,
            len = $arr.length,
            id = $arr[$i]; //服务器ID
        if ($i >= len || len == 0) {
            return
        };
        console.log($arr)
        that.weixin.img.download({
            id: id,
            fun2: function(d) {
                _i = parseInt($i) + 1;
                alert(d);
                alert($i);
                if (window.__wxjs_is_wkwebview) {
                    wx.getLocalImgData({
                        localId: d, // 图片的localID
                        success: function(res) {
                            var localData = res.localData; // localData是图片的base64数据，可以用img标签显示
                            $("#" + id + "").attr("src", localData);
                            $("#" + id + "").css("height", "");
                            that.getImg(_i, $arr);
                        }
                    });
                } else {
                    // alert(d,x);
                    $("#" + id + "").attr("src", d);
                    $("#" + id + "").css("height", "");
                    that.getImg(_i, $arr)
                }
            }
        });
        wximgArr = [];
    };
    //播放视频
    this.playVideo = function() {
        var url,
            html,
            model = that.bkblInfo.model,
            src;
        if (model == 3) {
            url = that.bkblInfo.source;
            html = '<iframe id="" style="width:100%;height:100%;position:absolute;" frameborder="0" src="./playMp4.html?source=' + encodeURIComponent(url) + '"></iframe>';
            $("#video").html(html);
        } else {
            $.ajax({
                url: that.bkblInfo.source,
                dataType: 'jsonp',
                success: function(d) {
                    var $d = d;
                    url = $d.data.liveurl;
                    html = '<iframe id="" style="width:100%;height:100%;position:absolute;" frameborder="0" src="./playHls.html?source=' + encodeURIComponent(url) + '"></iframe>';
                    $("#video").html(html);
                }
            });
        }
    };
    this.send_check = function(msg) {
        //检查发布内容
        var $msg = msg;
        if (msg == "") {
            alert("请输入内容");
            return false;
        } else if (strlen(msg) >= 200) {
            alert("输入内容不要超过100个字");
            return false;
        } else {
            return true;
        }
    };
    this.toggle_video = function(dt) {
        var vb1 = $("#video"),
            vb2 = $(".viewType"),
            $dt = dt || "",
            css1 = { "position": "absolute", "top": "-100000px" },
            css2 = { "position": "relative", "top": "0" },
            css;
        if ($dt) {
            css = css1;
        } else {
            css = css2;
        }
        vb1.css(css);
        vb2.css(css);

    };
    //获取音频时长，改变样式
    this.audio_t = function(ele) {
            var _ele = ele,
                _d = Math.ceil(_ele.duration),
                fele = $(_ele).siblings("a");
            alert(_d);
            // fele.find(".voiceTime").html(_d + "\"");
            // fele.
        }
        //audio元素播放时
    this.audio_play = function(e) {
        var ele = e,
            cEle = $(e).siblings('.btn_playRecord2').find(".audioPlaying")[0], //红点提示
            tEle = $(e).siblings('.btn_playRecord2').find(".voiceTime")[0], //倒计时
            time = Math.ceil(ele.duration);
        $(cEle).show();
        // that.audio_time(tEle, time);
        that.audio_playing = true;
        that.audio_playEle = ele;
        // that.audio_playcEle = cEle;
    };
    this.audio_time = function(e, t) {
        var _e = e,
            _t = t;
        $(_e).html(_t + "\"");
        that.audio_timeout = setTimeout(function() {
            console.log(_t)
            var $t = _t - 1;
            z_init.audio_time(_e, $t);
        }, 1000)
    };
    //audio元素播放终止时
    this.audio_stop = function(e) {
        //元素播放停止
        var ele = e,
            cEle = $(e).siblings('.btn_playRecord2').find(".audioPlaying")[0],
            tEle = $(e).siblings('.btn_playRecord2').find(".voiceTime")[0]; //倒计时
        $(cEle).hide();
        delete that.audio_playing;
        delete that.audio_playEle
    };
    //统计接口
    this.count = function(opt) {
        var $opt = opt || {},
            type = $opt.type,
            boxid = that.bkblInfo.boxid || "",
            data = {
                m: params.count,
                talk_id: this.data.talk_id,
                xopenid: this.data.xopenid,
                type: type,
                box: boxid
            };
        invoke({
            data: data,
            fun: function(d) {
                console.log(d);
            }
        })

    };

    function close() {
        $(that.ele.mask).remove();
        $(that.ele.nav).remove();
        $(that.ele.dialog).remove();
    };
};

//微信api准备就绪，配置分享
wx.ready(function() {

    invoke({
        data: { m: params.getShare, talk_id: TID },
        fun: function(d) {
            var opt = {
                title: d.title,
                desc: d.desc,
                imgUrl: d.image,
                link: d.url,
                success: function() {
                    z_init.count({ type: 5 })
                },
                cancel: function() {

                }
            }
            wxBind(opt)
        },
        err: function(d) {
            var opt = "";
            wxBind(opt)
        }
    })

    function wxBind(opt) {
        wx.onMenuShareAppMessage(opt);
        wx.onMenuShareTimeline(opt);
        wx.onMenuShareQQ(opt)
        wx.onMenuShareWeibo(opt)
        wx.onMenuShareQZone(opt)
    }

    wx.onVoicePlayEnd({
        success: function(res) {
            var localId = res.localId; // 返回音频的本地ID
            if (z_init.voice_playEle) {
                var ele = z_init.voice_playEle,
                    vid = z_init.voice_playId;
                $(ele).hide();
                delete z_init.voice_playId;
                delete z_init.voice_playing;
                delete z_init.voice_playEle;
            }
        }
    });

});
//socket服务配置

function wsInit() {
    window.ws = new WebSocket(URL_socket);

    ws.onopen = function() {
        // Web Socket 已连接上，使用 send() 方法发送数据
        // alert("链接成功...");
        console.log("链接成功")
    };

    ws.onmessage = function(evt) {
        var res = JSON.parse(evt.data),
            rm = res.data,
            type = res.cmdtype;
        switch (type) {
            case "getchatinfo":
                //主持精彩聊天有更新
                NUM = rm;
                console.log(NUM);
                if (!WSnum) {
                    // NUM = rm.data;
                    window.WSnum = {};
                    WSnum.host = NUM.subject;
                    WSnum.wonder = NUM.special;
                    WSnum.chat = NUM.chatroom;
                } else {
                    if (WSnum.host != rm.subject) {
                        var s = parseInt(rm.subject) - parseInt(WSnum.host);
                        var html = '主持<span class="weui-badge">' + s + '</span>';
                        $("#main_navbar a[dataType='host']").html(html)
                    }
                    if (WSnum.wonder != rm.special) {
                        var s = parseInt(rm.special) - parseInt(WSnum.wonder);
                        var html = '精彩<span class="weui-badge">' + s + '</span>';
                        $("#main_navbar a[dataType='wonder']").html(html)
                    }
                    if (WSnum.chat != rm.chatroom) {
                        var s = parseInt(rm.chatroom) - parseInt(WSnum.chat);
                        var html = '聊天<span class="weui-badge">' + s + '</span>';
                        $("#main_navbar a[dataType='chat']").html(html)
                    }
                }
                break;
            case "changechatinfo":
                //客户端设置有更新
                if (rm.type == 1) {
                    //基础设置
                    //获取边看边聊借口信息
                    z_init.get_bkbl();
                } else {
                    //播报区
                    z_init.get_broadList();
                }
                break;
        }
    };

    ws.onclose = function() {
        // 关闭 websocket
        wsInit()
            // alert("连接已关闭...尝试重连");
    };
    ws.onerror = function(evt) {
        // alert("WebSocketError!");
        // wsInit()
    };
}
