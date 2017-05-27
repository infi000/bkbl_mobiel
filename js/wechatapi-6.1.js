wx.ready(function () {
	if(typeof(wxhideOptionMenu)!="undefined"){
		wx.hideOptionMenu();
	}
	//alert("初始化2")
  // 5 图片接口
  // 5.1 拍照、本地选图
  var configparms=wx.configparms||{};
  //alert("wx.ready="+wx.configparms.error);
  if(wx.configparms.error){//初始化失败
	  return;
  }
  function uploadimg2wechatcloud(localIds,uploadImageCallback){ 
	    var imagecount=localIds.length;
	  //  alert("imagecount="+imagecount);
	  	function upprocess(upoffset){
	  		if(upoffset<=imagecount){
	  			//alert(upoffset+">>"+JSON.stringify(localIds[upoffset-1]));
	  			/*
	  			var wechatuploadalertobj=document.getElementById("wechatuploadalert");
				if(wechatuploadalertobj){
					wechatuploadalertobj.innerText='请耐心等待('+upoffset+'/'+imagecount+'张图片)...';
				}
				*/
	  		//	alert(localIds[upoffset-1].url);
	  			upload(upoffset,localIds[upoffset-1].url||localIds[upoffset-1].image); 
			}else{
				/*
				var wechatuploadbgobj=document.getElementById("wechatuploadbg");
				if(wechatuploadbgobj){
					wechatuploadbgobj.outerHTML="";
				} 
				var wechatuploadalertobj=document.getElementById("wechatuploadalert");
				if(wechatuploadalertobj){
					wechatuploadalertobj.outerHTML="";
				} 
				*/
			} 
	  	}
		function upload(upoffset,localId) {
			
			if(localId.indexOf("wxLocalResource://")==0 || localId.indexOf("weixin://")==0){ 
				// alert("uploadImage="+localId);
				  wx.uploadImage({ 
				    localId:localId,
				    isShowProgressTips:1,
				    success: function (res) { 
				       
				      //document.body.insertAdjacentHTML("beforeEnd",'已上传：' + i + '/' + length+"\r\n"+JSON.stringify(res));
					//  var access_token=configparms.access_token;
					  var media_id=res.serverId;
					  var urlstr="wechat://"+res.serverId
					//	+"&access_token="+access_token
						;
					   
					  var imageobj={datatype:"image",localid:localId,mediaid:media_id,url:urlstr}; 
				      if(uploadImageCallback){
				    	  uploadImageCallback(imageobj,upoffset);
				      } 
				      upprocess(upoffset+1);   
				    },
				    fail: function (res) {  
				      alert("上传失败"+JSON.stringify(res)); 
				      if(uploadImageCallback){
				    	  uploadImageCallback(null,upoffset);
				      } 
				      upprocess(upoffset+1);
				    }
				  });
			}else{
				/*
				alert(localId
						+'\r\nlocalId.indexOf("wxLocalResource://")'+localId.indexOf("wxLocalResource://")
						+'\r\nlocalId.indexOf("weixin://")'+localId.indexOf("weixin://")
				); 
				*/
				 var imageobj={url:localId}; 
			      if(uploadImageCallback){
			    	  uploadImageCallback(imageobj,upoffset);
			      } 
			      upprocess(upoffset+1);
			}
		} 
		if(imagecount>0){
			/*
			var wechatuploadbgobj=document.getElementById("wechatuploadbg");
			if(wechatuploadbgobj){
				wechatuploadbgobj.outerHTML="";
			} 
			var wechatuploadalertobj=document.getElementById("wechatuploadalert");
			if(wechatuploadalertobj){
				wechatuploadalertobj.outerHTML="";
			}
			document.body.insertAdjacentHTML("beforeEnd" 
		  			  ,'<div id="wechatuploadbg" style="opacity:0.3;position:fixed;left:0px;top:0px;z-index:100004;width:100%;height:100%;background-color:#FFFFFF">&nbsp;</div>'
		  			  +'<div id="wechatuploadalert"'
		  			  +'style="text-align:center;background-color:#000000;color:#ffffff;'
		  			  +'position:fixed;left:0px;top:0px;z-index:100005;' 
		  			  +'width:100%;height:40px;line-height:40px">请您耐心等待(共'+localIds.length+'张图片)...'
		  			  +'</div>');
		  	*/
			 
			//if(navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
				setTimeout(function(){
					upprocess(1); 
				},1000); 
			//}
		}
  }
  
  wx.configparms.chooseImage=function(chooseImageCallback){
	  wx.chooseImage({
	      success: function (res) {  
	    	var localids=res.localIds; 
	    	var localidslen=localids.length;
	    	if(localidslen>0){ 
	    		//wxLocalResource://131231234
	    		//weixin://resourceid/19c51ab9c79f64514909f1ff3483dd10;
	    		//alert(localids[0]);
				/*
	    		if(navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
			    	for(var i=0;i<localids.length;i++){
			    		var imageobj={datatype:"image",url:localids[i]};
			    		if(chooseImageCallback){
			    			chooseImageCallback(imageobj);
			    		} 
			    	} 
	    		}else{
	    			setTimeout(function(){
	    				if(localidslen>1){
	    					alert("建议只选一张图片，图片上传成功后，剩余图片请分次选择。");
	    				}
	    				var imageobj={datatype:"image",url:localids[0]};
	    				uploadimg2wechatcloud([imageobj],chooseImageCallback);
	    			},10);
	    		}
				*/
				setTimeout(function(){
					if(localidslen>1){
						alert("建议只选一张图片，图片上传成功后，剩余图片请分次选择。");
					}
					var imageobj={datatype:"image",url:localids[0]};
					uploadimg2wechatcloud([imageobj],chooseImageCallback);
				},10);
				
	    	}
	      }
	  });
  };
  
  // 下载图片
	wx.configparms.downloadImage=function(serverId,fn){
		if (serverId == '') {
			alert('请先使用 uploadImage 上传图片');
			return;
		}
		wx.downloadImage({
			serverId: serverId,
			success: function (res) {
				fn(res.localId);
			}
		});
	};
	
  wx.configparms.uploadImageWithWechat=function(localIds,uploadImageCallback){ 
		uploadimg2wechatcloud(localIds,uploadImageCallback);
  };
 // alert("wx.configparms.pageSharego=function(shareparms,shareCallback)");
  wx.configparms.pageSharego=function(shareparms,shareCallback){
	 
	  wx.onMenuShareAppMessage(shareparms);
	  wx.onMenuShareTimeline(shareparms);
	  wx.onMenuShareQQ(shareparms);
	  wx.onMenuShareWeibo(shareparms);
	  // 2.1 监听“分享给朋友”，按钮点击、自定义分享内容及分享结果接口
	 // alert(">>wx.configparms.pageSharego");
	  /*wx.onMenuShareAppMessage({
	      title:shareparms.title||"",
	      desc:shareparms.desc||"",
	      link:shareparms.link||"",
	      imgUrl:shareparms.imgUrl||"",
	      trigger: function (res) {},
	      success: function (res) {
	         if(shareCallback){
	        	 shareCallback('shareAppMessage');
	         }
	      },
	      cancel: function (res) {},
	      fail: function (res) {}
	   });
	   
	 // alert("2.1 监听“分享给朋友”，按钮点击、自定义分享内容及分享结果接口\r\n"+JSON.stringify(shareparms));
	  //2.2 监听“分享到朋友圈”按钮点击、自定义分享内容及分享结果接口
	  wx.onMenuShareTimeline({
	      title:shareparms.title||"",
	      desc:shareparms.desc||"",
	      link:shareparms.link||"",
	      imgUrl:shareparms.imgUrl||"",
	      trigger: function (res) {},
	      success: function (res) {
	         if(shareCallback){
	        	 shareCallback('shareTimeline');
	         }
	      },
	      cancel: function (res) {},
	      fail: function (res) {}
	   });
	// 2.3 监听“分享到QQ”按钮点击、自定义分享内容及分享结果接口 
	  wx.onMenuShareQQ({
	      title:shareparms.title||"",
	      desc:shareparms.desc||"",
	      link:shareparms.link||"",
	      imgUrl:shareparms.imgUrl||"",
	      trigger: function (res) {},
	      success: function (res) {
	         if(shareCallback){
	        	 shareCallback('shareQQ');
	         }
	      },
	      cancel: function (res) {},
	      fail: function (res) {}
	   });
	// 2.4 监听“分享到微博”按钮点击、自定义分享内容及分享结果接口
	  wx.onMenuShareWeibo({
	      title:shareparms.title||"",
	      desc:shareparms.desc||"",
	      link:shareparms.link||"",
	      imgUrl:shareparms.imgUrl||"",
	      trigger: function (res) {},
	      success: function (res) {
	         if(shareCallback){
	        	 shareCallback('shareWeibo');
	         }
	      }, 
	      cancel: function (res) {},
	      fail: function (res) {}
	   });*/
  }; 
  
  //alert(">>wx.configparms.pageShareParm>>ready>>"+wx.configparms.pageShareParm);
  if(wx.configparms.pageShareParm){
	  wx.configparms.pageSharego(wx.configparms.pageShareParm,wx.configparms.pageShareCallback);
  }


	///////////音频
	var _micphoneCss=true;
	wx.configparms.recordSound=function(recordCallback,parms){
		var stopRecordText="点击停止录音";
		if(parms){
			if(parms["stopRecordText"]){
				stopRecordText=parms["stopRecordText"];
			}
		}
		var micphoe_cssStr="@-webkit-keyframes micphone_wxfade_inOut{0%{opacity:1}100%{opacity:0}}@keyframes micphone_wxfade_inOut{0%{opacity:1}100%{opacity:0}}.micphone_wx{position:fixed;left:50%;top:50%;z-index:100000000;width:120px;height:120px;margin:-60px 0 0 -60px;background-color:rgba(0,0,0,0.8);border-radius:8px;text-align:center;color:#FFF;display:none}.micphone_wx a{display:block;padding:5px;color:#FFF;text-decoration:none;-webkit-tap-highlight-color:rgba(0,0,0,1);-webkit-tap-highlight-color:transparent}.micphone_wx .micphonesvg{width:60px}.micphone_wx .micphonesvg polygon{opacity:0}.micphone_wx.animation .micphonesvg polygon{opacity:0;-webkit-animation-name:micphone_wxfade_inOut;-webkit-animation-duration:2.1s;-webkit-animation-iteration-count:infinite;-webkit-animation-direction:linear}.micphone_wx .micphonesvg .fade_1{-webkit-animation-delay:0s}.micphone_wx .micphonesvg .fade_2{-webkit-animation-delay:.3s}.micphone_wx .micphonesvg .fade_3{-webkit-animation-delay:.6s}.micphone_wx .micphonesvg .fade_4{-webkit-animation-delay:.9s}.micphone_wx .micphonesvg .fade_5{-webkit-animation-delay:1.2s}.micphone_wx .micphonesvg .fade_6{-webkit-animation-delay:1.5s}.micphone_wx .micphonesvg .fade_7{-webkit-animation-delay:1.8s}.micphone_wx .micphonesvg .fade_8{-webkit-animation-delay:2.1s}";
		var html='<div id="wechatuploadsoundbg" style="opacity:0.3;position:fixed;left:0px;top:0px;z-index:100004;width:100%;height:100%;background-color:#FFFFFF">&nbsp;</div>'
			+'<div id="micphone_wx_h" class="micphone_wx animation">'
			+'<a href=javascript:void(0)>'
			+'<svg class="micphonesvg" width="76px" height="70px" viewBox="0 0 76 70">'
			+'<g>'
			+'<path fill="#FFFFFF" d="M23.714,1.515c-8.144,0-14.77,6.626-14.77,14.77v9v3.486v9c0,8.144,6.626,14.769,14.77,14.769s14.769-6.625,14.769-14.769v-9v-3.486v-9C38.482,8.141,31.857,1.515,23.714,1.515z"/>'
			+'<path fill="#FFFFFF" d="M44.539,38.962v-6.666H40.54v6.666c0,9.278-7.548,16.825-16.826,16.825S6.888,48.24,6.888,38.962H6.887v-6.666H2.888v6.666c0,10.808,8.278,19.714,18.826,20.724v4.791H8.061v4h31.306v-4H25.714v-4.791C36.262,58.676,44.539,49.77,44.539,38.962z"/>'
			+'<polygon class="fade_1" fill="#FFFFFF" points="50.709,64.771 50.709,68.485 61.194,68.485 61.929,64.771"/>'
			+'<polygon class="fade_2" fill="#FFFFFF" points="50.709,56.679 50.709,60.393 62.793,60.393 63.525,56.679"/>'
			+'<polygon class="fade_3" fill="#FFFFFF" points="50.709,48.585 50.709,52.3 64.391,52.3 65.123,48.585"/>'
			+'<polygon class="fade_4" fill="#FFFFFF" points="50.709,40.492 50.709,44.207 65.987,44.207 66.722,40.492"/>'
			+'<polygon class="fade_5" fill="#FFFFFF" points="50.709,32.4 50.709,36.115 67.586,36.115 68.319,32.4"/>'
			+'<polygon class="fade_6" fill="#FFFFFF" points="50.709,24.308 50.709,28.022 69.184,28.022 69.916,24.308"/>'
			+'<polygon class="fade_7" fill="#FFFFFF" points="50.709,16.215 50.709,19.93 70.781,19.93 71.515,16.215"/>'
			+'<polygon class="fade_8" fill="#FFFFFF" points="50.709,8.122 50.709,11.837 72.379,11.837 73.112,8.122"/>'
			+'</g></svg><p class="tet" style="color:white;height:40px;">'+stopRecordText+'<br><em id="micphone_wxcurtimes_box" style="font-style:normal;display:none;"><font id="micphone_wxcurtimes"></font>秒</em></p></a><p style="color:#333;margin-top:10px;width:200px; margin-left:-40px;">录音时间最长一分钟</p></div>';
		function hasClass(ele,cls){
			return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
		}
		function addClass(ele,cls){
			if (!hasClass(ele,cls)){
				ele.className += " "+cls;
			} 
		}
		function removeClass(ele,cls){ 
			if (hasClass(ele,cls)){
			var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
				ele.className=ele.className.replace(reg,' ');
			}
		}
		function setmicphoneCss(){
			try{
				var style = document.createStyleSheet();
				style.cssText = micphoe_cssStr;
			}
			catch(e){
				var style = document.createElement("style");
				style.type = "text/css";
				style.textContent = micphoe_cssStr;
				document.getElementsByTagName("head").item(0).appendChild(style);
			}
		}
		if(_micphoneCss){
			setmicphoneCss();
			_micphoneCss = false;
		}
		document.body.insertAdjacentHTML("afterBegin",html);
		var wechatuploadsoundbgobj=document.getElementById("wechatuploadsoundbg");
		var micphone_wx_h = document.getElementById("micphone_wx_h");
		micphone_wx_h.style.display="none";
		wechatuploadsoundbgobj.style.display="none";
		micphone_wx_h.onclick = function(){
			micphone_wx_h.outerHTML="";
			wechatuploadsoundbgobj.outerHTML="";
			removeClass(micphone_wx_h, "animation");
			wx.configparms.recordSoundStop(
				function(localId){
					if(localId){
						_voicestop(localId);
					}
				}
			);
			micphone_wx_h.onclick = null;
		}
		setTimeout(function(){
			micphone_wx_h.outerHTML="";
			wechatuploadsoundbgobj.outerHTML="";
			removeClass(micphone_wx_h, "animation");
			wx.configparms.recordSoundStop(
				function(localId){
					if(localId){
						_voicestop(localId);
					}
				}
			);
			micphone_wx_h.onclick = null;
		},50000);
		function _voicestop(localId){
			_mc_wxcurtime.state=true;
			wx.configparms.recordSoundUpload(localId,function(serverId){
				recordCallback(localId,serverId,_mc_wxcurtime.nums);
			});
			if(micphone_wx_h && wechatuploadsoundbgobj){
				micphone_wx_h.outerHTML="";
				wechatuploadsoundbgobj.outerHTML="";
				removeClass(micphone_wx_h, "animation");
			}
		}
		var _mc_wxcurtime={
			state:false,
			nums:1
		};
		function _wxcurtime(){
			if(_mc_wxcurtime.state){
				return;
			}
			document.getElementById("micphone_wxcurtimes").innerHTML=_mc_wxcurtime.nums;
			_mc_wxcurtime.nums++;
			setTimeout(function(){
				_wxcurtime();
			},1000);
		}
		// 开始录音
		wx.startRecord({
			cancel: function () {
				if(micphone_wx_h && wechatuploadsoundbgobj){
					micphone_wx_h.outerHTML="";
					wechatuploadsoundbgobj.outerHTML="";
					removeClass(micphone_wx_h, "animation");
				}
				//alert('用户拒绝授权录音');
			},
			success: function(){
				if(micphone_wx_h && wechatuploadsoundbgobj){
					micphone_wx_h.style.display="block";
					wechatuploadsoundbgobj.style.display="block";
				}
				setTimeout(function(){
					document.getElementById("micphone_wxcurtimes_box").style.display="block";
					_wxcurtime();
				},1000);
			}
		});
		// 监听录音自动停止
		wx.onVoiceRecordEnd({
			complete: function (res) {
				_voicestop(res.localId);
				//alert('录音时间已超过一分钟');
			}
		});
	};
	wx.configparms.recordSoundStop=function(fn){
		// 停止录音
		wx.stopRecord({
			success: function (res) {
				fn(res.localId);
			},
			fail: function (res) {
				fn();
				//alert(JSON.stringify(res));
			}
		});
	}
    wx.configparms.recordSoundUpload=function(localId,fn){
		if (localId == '') {
      		alert('请先使用 startRecord 接口录制一段声音');
        	return;
    	}
		wx.uploadVoice({
			localId: localId,
			success: function (res) {
				//alert('上传语音成功，serverId 为' + res.serverId);
				fn(res.serverId);
			}
		});
	}
	// 下载语音
	wx.configparms.recordSoundDownload=function(serverId,fn){
		if (serverId == '') {
			alert('请先使用 uploadVoice 上传声音');
			return;
		}
		wx.downloadVoice({
			serverId: serverId,
			success: function (res) {
				fn(res.localId);
			}
		});
	};
	//播放音频
	wx.configparms.playVoice=function(localId){
		if (localId == '') {
			alert('请先使用 startRecord 接口录制一段声音');
			return;
		}
		wx.playVoice({
			localId:localId
		});
	}
	//暂停播放音频
	wx.configparms.pauseVoice=function(localId){
		wx.pauseVoice({
			localId:localId
		});
	}
	//停止播放音频
	wx.configparms.stopVoice=function(localId){
		wx.stopVoice({
			localId:localId
		});
	}
	//监听录音播放停止
	wx.configparms.onVoicePlayEnd=function(fn){
		wx.onVoicePlayEnd({
			complete: function (res) {
				fn(res.localId);
			}
		});
	}
	
	//隐藏右上角菜单接口
	wx.configparms.hideOptionMenu=function(fn){
		wx.hideOptionMenu();
	}
	
	//显示右上角菜单接口
	wx.configparms.showOptionMenu=function(fn){
		wx.showOptionMenu();
	}
	
	
	// 获取当前地理位置
	wx.configparms.getLocation=function(fn){
		wx.getLocation({
			success: function (res) {
				var gps = navigator.geolocation;
				if (!gps) {
                    console.log('not support gps');
                    return false;
                }
				// gps 感应器
                gps.getCurrentPosition(
                    function(position) {
						fn(position);
                        console.log(position);
                        /*if (position) {
                            callback(position.coords.latitude, position.coords.longitude);
                        } else {
                            console.log('position is null');
                            callback(undefined, undefined);
                        }*/
                    },
                    function(error) {
                        console.log('get gps info failed', error);
                        //module.exports.h5SetError(error);
                        //callback(undefined, undefined);
                    },
                    {maximumAge: 10000}
                );
				fn(res);
			},
			cancel: function (res) {
				alert('用户拒绝授权获取地理位置');
			}
		});
	};
	
	wx.configparms.previewImage=function(current,urls){
		wx.previewImage({
		  current: current,
		  urls: urls
		});
	};


  wx.checkJsApi({
      jsApiList: [
        'checkJsApi',
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'onMenuShareQQ',
        'onMenuShareWeibo',
        'onMenuShareQZone',
        'hideMenuItems',
        'showMenuItems',
        'hideAllNonBaseMenuItem',
        'showAllNonBaseMenuItem',
        'translateVoice',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'onVoicePlayEnd',
        'pauseVoice',
        'stopVoice',
        'uploadVoice',
        'downloadVoice',
        'chooseImage',
        'previewImage',
        'uploadImage',
        'downloadImage',
        'getNetworkType',
        'openLocation',
        'getLocation',
        'hideOptionMenu',
        'showOptionMenu',
        'closeWindow',
        'scanQRCode',
        'chooseWXPay',
        'openProductSpecificView',
        'addCard',
        'chooseCard',
        'openCard'
      ],
      success: function (res) {
        //alert(JSON.stringify(res));
        if(res && res.checkResult){
        	wx.configparms.checkResult=res.checkResult;
        }  
      }
    });
  
});
//alert(1);
wx.error(function (res) { 
	wx.configparms.error=true; 
	//alert(JSON.stringify(res));
});