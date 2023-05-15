const { Controller } = require('../common/uni-cloud-router')

module.exports = class MpController extends Controller {
	async init() {}

	/**
	 * 定时器，
	 */
	async timer() {}
	/**
	 * 授权小程序
	 */
	async api_create_preauthcode() {
		//https://tmall-api.cqsort.com/http/wxpay-v3/mp/api_create_preauthcode/__UNI__9E9D6A0
		console.log("api_create_preauthcode")
		//https://tmall-api.cqsort.com/?auth_code=queryauthcode@@@pt4X4HljLWpgssZ86gDL4MYJSNDZCL9KYJI1iMtI3GKPfnpANeGJx6atIaN8mAvX3qxdybJAkPR2UqleMKkF6Q&expires_in=3600#/
		let url = await this.service.weixin.component.applet.api_create_preauthcode();
		this.ctx.headers["content-type"] = "text/html";
		return `<!DOCTYPE html>
		<html lang="en">
		  <head>
		    <meta charset="UTF-8" />
		    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
		    <title></title>
			<script type='text/javascript'>
				window.location.href = "${url}"
			</script>
		  </head>
		  <body>
		  </body>
		</html>`
	}
	/**
	 * 授权小程序回调地址，
	 * 将来这里与公众号绑定，长按扫码关注公众号，并绑定openid，接收1条公众号消息，从消息或者菜单中管理店铺和后台账户密码（微信扫码登录）
	 * 2022-11-03测试：跳转地址晚于事件回调2秒，如果这里先进行公众号绑定，肯定来得及与用户绑定
	 */
	async api_create_preauthcode_result() {
		//存在get参数,应该比推送更快
		console.log(this.ctx.query)
		this.ctx.headers["content-type"] = "text/html";

		return `<!DOCTYPE html>
		<html lang="en">
		  <head>
		    <meta charset="UTF-8" />
		    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
		    <title>授权成功</title>
		  </head>
		  <body>
				<h3 style="text-align:center;padding-top:20%;">恭喜你授权成功</h3>
		  </body>
		</html>`
	}

	async ticket() {
		this.ctx.headers["content-type"] = "text/html";
		console.log(this.ctx.query)
		// console.log(this.ctx.event)
		// console.log(this.ctx.context)
		console.log(this.ctx.data)
		let content = {}
		if (this.ctx.data) {
			content = this.ctx.data;
		} else {
			content = this.ctx.parseWxXML(this.ctx.event.body)
		}
		console.log("data", content)
		content = await this.service.weixin.component.basic.decrypt(this.ctx.query, content);
		console.log("content", content)
		const {
			info_type
		} = content
		//unauthorized 取消授权，authorized确定授权,component_verify_ticket更新ticket
		await this.service.weixin.component.applet[info_type](content);
		return "success"
	}
	async callback() {
		console.log(this.ctx.query)
		console.log(this.ctx.data)
	}
	// async check() {
	// 	//1、公众号验证，只有get参数
	// 	//2、普通消息，除了get参数，还有post加密参数
	// 	console.log(this.ctx.query)
	// 	console.log(this.ctx.data)
	// 	//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX
	// 	//wbjwazJuGEfN9oEOHAWcVUFs3E7N6fgVGVDek96gfhc
	// 	console.log("this.ctx.data.echostr", this.ctx.data.echostr)
	// 	this.ctx.headers["content-type"] = "text/html;charset=utf-8";
	// 	return this.ctx.data.echostr;
	// 	//{"echostr":"7280837061730762682","nonce":"1690009142","signature":"cdc38aa3916478ce22ce3d46a0b406dac58f7068","timestamp":"1662353336"}
	// }
	async message() {
		this.ctx.headers["content-type"] = "text/html";
		if (this.ctx.data.echostr) {
			//公众号接口验证
			return this.ctx.data.echostr;
		}
		let {
			MsgType,
			Event,
			EventKey
		} = this.ctx.data
		//{"echostr":"7280837061730762682","nonce":"1690009142","signature":"cdc38aa3916478ce22ce3d46a0b406dac58f7068","timestamp":"1662353336"}
		// {"ToUserName":"gh_d224039b88de","FromUserName":"ov7Ue52jOWPY1PCBu2e3yOXSJrTM","CreateTime":"1662365351","MsgType":"event","Event":"subscribe","EventKey":""}
		//{"nonce":"1497549628","openid":"ov7Ue52jOWPY1PCBu2e3yOXSJrTM","signature":"1d6f35b32dc950a3bda69267125eb593077c9a09","timestamp":"1662364193"}
		// {"ToUserName":"gh_d224039b88de","FromUserName":"ov7Ue52jOWPY1PCBu2e3yOXSJrTM","CreateTime":"1662364192","MsgType":"text","Content":"来了来了来了来了来了来了，来了就来了就好的","MsgId":"23799330441136176"}
		console.log(this.ctx.query)
		console.log(this.ctx.data)
		let result = false;
		try {
			if (!Event) {
				Event = "info"
			}
			console.log(MsgType, Event)
			//动态调用mp扩展下的方法
			result = await this.service.weixin.mp[MsgType][Event](this.ctx.data, EventKey)
		} catch (e) {
			//TODO handle the exception
			console.log("调用报错了")
			console.log(e.message)
		}
		if (!result) {
			//用户不会收到消息
			return "success";
		}
		//处理返回内容，文字、图文，视频，。。。{type:image,xxxx}
		if (this.ctx.isPlainObject(result)) {
			let {
				type
			} = result;
			let content = await this.service.weixin.mp.message[type](result.data);
			return this.ctx.buildWxXML({
				"ToUserName": this.ctx.data.FromUserName,
				"FromUserName": this.ctx.data.ToUserName,
				"CreateTime": parseInt(Date.now() / 1000),
				...content
			});
		}
		//默认返回文本
		return this.ctx.buildWxXML({
			"ToUserName": this.ctx.data.FromUserName,
			"FromUserName": this.ctx.data.ToUserName,
			"CreateTime": parseInt(Date.now() / 1000),
			MsgType: "text",
			Content: result,
		});
	}

}
