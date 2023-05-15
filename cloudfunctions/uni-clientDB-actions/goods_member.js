// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const createConfig = require('uni-config-center');
/**
 * 处理商品的会员价，根据用户等级，计算折扣
 */
module.exports = {
	before: async (state, event) => {},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let {
			exchange_points_for_cash, //积分兑换现金
			score_to_money_rate
		} = getConfigs.config("mall.order")
		// console.log("goods_member")
		// console.log("result", isGetOne, result)
		if (result.data._id) {
			getMemberInfo(result.data, score_to_money_rate, exchange_points_for_cash)
		} else {
			result.data.forEach(item => {
				getMemberInfo(item, score_to_money_rate, exchange_points_for_cash)
			})
		}
		return result
	}
}
const getConfigs = createConfig({
	pluginId: 'tiantian-mall', // 插件id, 注意pluginId需和uni-config-center下的目录名一致
	defaultConfig: {}, // 默认配置，非必填
	customMerge: (defaultConfig, userConfig) => {
		// 自定义默认配置和用户配置的合并规则，非必填，不设置的情况侠会对默认配置和用户配置进行深度合并
		// defaudltConfig 默认配置
		// userConfig 用户配置
		return Object.assign(defaultConfig, userConfig)
	}
});
/**
 * 根据用户信息，判断商品会员折扣
 */
const getMemberInfo = (item, score_to_money_rate, exchange_points_for_cash) => {
	//构造假数据
	let rate = 0.85;
	if (item.is_vip) {
		item.member = {
			level: 2,
			enable: true,
			end_time: 1650339596000,
			rate: rate,
			name: "铂金会员"
		}
	}
	// item.score2moneyRate = score_to_money_rate;
	// //积分+现金模式
	// if (item.use_score_rate) {
	// 	//这里要乘以积分兑换现金的比例，才是要减去的金额
	// 	let newPrice = parseInt(item.price * (100 - parseInt(item.use_score_rate * 100)) / 100);
	// 	if (newPrice > 0) {
	// 		item.use_score = (item.price - newPrice) / score_to_money_rate / 100; //乘以积分价值
	// 		if (exchange_points_for_cash) {
	// 			item.price = newPrice;
	// 		}
	// 	}
	// } else if (item.use_score) {
	// 	//固定数量的积分
	// 	let scoreMoney = item.use_score * score_to_money_rate * 100;
	// 	item.origin_price = item.price;
	// 	if (exchange_points_for_cash) {
	// 		item.price = parseInt((item.price - scoreMoney).toFixed(2));
	// 	}
	// }
	//处理评论好评率,百分比
	item.commentGoodRate = 100;
	let manfen = 5;
	if (item.comment_total_rate && item.comment_count) {
		item.commentGoodRate = parseFloat(item.comment_total_rate / (item.comment_count * manfen)).toFixed(2) * 100
	}

	//前端只显示2条
	if (item.comments) {
		item.comments = item.comments.splice(0, 2)
	}
}
