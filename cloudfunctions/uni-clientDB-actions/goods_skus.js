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
		let getParams = state.command.getParam({
			name: 'get',
			index: 0
		});
		//是否只返回一条
		let {
			score_to_money_rate,
			exchange_points_for_cash
		} = getConfigs.config("mall.order")
		// console.log("goods_member")
		// console.log("result", isGetOne, result)
		let fields = ["use_score_rate", "use_score"]
		result.data.forEach(item => {
			let goods = item.goods_id[0];
			for (let f of fields) {
				if (goods[f]) {
					item[f] = goods[f];
				}
			}
			if (!item.goods_thumb) {
				item.goods_thumb = goods.goods_thumb;
			}
			delete item.goods_id;
			getMemberInfo(item, score_to_money_rate, exchange_points_for_cash)
		})
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
	item.score2moneyRate = score_to_money_rate;
	//积分+现金模式
	if (item.use_score_rate) {
		//这里要乘以积分兑换现金的比例，才是要减去的金额
		let newPrice = parseInt(item.price * (100 - parseInt(item.use_score_rate * 100)) / 100);
		if (newPrice > 0) {
			item.use_score = (item.price - newPrice) / score_to_money_rate / 100; //乘以积分价值
			if (exchange_points_for_cash) {
				item.price = newPrice;
			}
		}
	} else if (item.use_score) {
		//固定数量的积分
		let scoreMoney = item.use_score * score_to_money_rate * 100;
		item.origin_price = item.price;
		if (exchange_points_for_cash) {
			item.price = parseInt((item.price - scoreMoney).toFixed(2));
		}
	}
}
