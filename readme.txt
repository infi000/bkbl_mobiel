


num=socket服务器总数
ws=客户端获取总数


1:链接成功====》设置NUM和WS


2：发送聊天===》  ws+1



3:收到广播===》 data与ws对比==>提示data-ws个新消息==>  num=data;



4；刷新列表==》 ws=num


