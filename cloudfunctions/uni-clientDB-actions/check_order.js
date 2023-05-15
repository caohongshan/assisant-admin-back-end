// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let statusResultText = {
			"-3": "退款失败",
			"-2": "退款拒绝",
			"-1": "已取消",
			"0": "待付款",
			"1": "已付款",
			"2": "已发货",
			"3": "已完成",
			"4": "已评价",
		}
		let statusResultColor = {
			"-3": "#cccccc",
			"-2": "#cccccc",
			"-1": "#cccccc",
			"0": "#ff5500",
			"1": "#00aa7f",
			"2": "#55aa7f",
			"3": "#00aa7f",
			"4": "#00aa7f",
		}
		let statusResultIcon = {
			"-3": "guanbi2",
			"-2": "guanbi2",
			"-1": "guanbi2",
			"0": "icon_pay_balance",
			"1": "yuanxingxuanzhong",
			"2": "yuanxingxuanzhong",
			"3": "yuanxingxuanzhong",
			"4": "yuanxingxuanzhong",
		}
		let group_buying_text = {
			"1": "拼单中",
			"2": "拼单成功",
			"3": "拼单失败",
		}
		let group_buying_content = {
			"1": "请耐心等待",
			"2": "订单已经拼单成功，请等待发货",
			"3": "很抱歉，拼单失败了，系统即将自动取消订单",
		}
		let group_buying_color = {
			"1": "#0055ff",
			"2": "#55aa7f",
			"3": "#ff5500",
		}
		result.data.forEach(item => {
			item.state = {
				value: item.state,
				color: statusResultColor[item.state],
				icon: statusResultIcon[item.state],
				text: statusResultText[item.state],
				content: ""
			};
			if (item.goods) {
				//判断商品是否可以支持售后服务
				item.goods.forEach(goods => {
					//从数据库读取字段
					if (!goods.refund_money) {
						goods.refund_money = 0;
					}
					if (!goods.discount) {
						goods.discount = Math.round((item.discount + item.total_fee) / goods
							.total * item.discount);
					}
					goods.canRefundMoney = goods.total - goods.discount - goods.refund_money;
					goods.canRefund = item.state.value > 1 && goods.canRefundMoney > 0 && !goods
						.is_refunding;
				})
			}
			//是否可以取消
			item.canCancel = item.state.value == 0 || item.state.value == 1;
			//拼单
			if (item.group_buying && item.state.value == 1) {
				item.canCancel = false;
				item.state.text = group_buying_text[item.group_buying.state]
				item.state.color = group_buying_color[item.group_buying.state]
				item.state.content = group_buying_content[item.group_buying.state]
			}
			//保证总金额，优惠是整数
			item.total_fee = parseInt(item.total_fee);
			item.discount = parseInt(item.discount);
			//快递单号信息,可能是这个订单发货，分摊到每件商品
			if (item.delivers) {
				//可能有多条
				let goodsDeliver = item.delivers.filter(e => e.goods_id);
				let goodsDeliverMap = {}
				if (goodsDeliver && goodsDeliver.length > 0) {
					goodsDeliver.map(gd => {
						let key = gd.goods_id;
						if (gd.sku_id) {
							key += "_" + gd.sku_id;
						}
						goodsDeliverMap[key] = gd;
					})
				}
				//最多只有一条
				// let orderDeliver = item.delivers.filter(e => !e.goods_id);
				// item.goods.forEach(g => {
				// 	if (orderDeliver && orderDeliver.length > 0) {
				// 		g.delivery = orderDeliver[0];
				// 	}
				// 	let key = g.goods_id;
				// 	if (g.sku_id) {
				// 		key += "_" + g.sku_id;
				// 	}
				// 	if (goodsDeliverMap[key]) {
				// 		g.delivery = goodsDeliverMap[key];
				// 	}
				// })
			}
		})

		return result
	}
}
