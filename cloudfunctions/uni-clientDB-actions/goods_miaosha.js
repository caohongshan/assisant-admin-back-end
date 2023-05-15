// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		//商品详情
		if (result.data._id) {
			checkMiaosha(result.data)
		} else {
			//商品列表
			result.data.forEach(item => {
				checkMiaosha(item)
			})
		}

		return result
	}
}

function checkMiaosha(goods) {
	let time = Date.now();
	const miaosha = goods.miaosha;
	if (miaosha && miaosha.end_time > time) {
		let stock = miaosha.limit_stock ? miaosha.limit_stock : goods.remain_count;
		//测试代码
		// miaosha.sale_count = miaosha.sale_count ? miaosha.sale_count : goods.month_sell_count
		//计算秒杀进度
		miaosha.progress = Math.ceil(miaosha.sale_count / (miaosha.sale_count + stock) * 100)
		if (miaosha.begin_time > time) {
			//秒杀尚未开始
			miaosha.is_begin = false;
			return;
		}
		miaosha.is_begin = true;
		//修改商品价格为秒杀价
		if (!goods.market_price) {
			goods.market_price = goods.price
		}
		//单规格
		if (!goods.sku_name || goods.sku_name.length == 0) {
			//当前商品详情可以显示秒杀
			miaosha.is_show = true;
			//如果是单规格，
			miaosha.origin_price = goods.price;
			//现价，四色五人
			goods.price = buildMiaoshaPrice(goods.price, miaosha)
		} else if (goods.sku_id == miaosha.sku_id) {
			miaosha.is_show = true;
			//多规格匹配
			miaosha.origin_price = goods.price;
			//现价，四色五人
			goods.price = buildMiaoshaPrice(goods.price, miaosha)
		} else if (!goods.sku_id) {
			miaosha.is_show = true;
			//商品列表，无规格限制，使用秒杀里面的price
			goods.market_price = miaosha.market_price;
			//现价，四色五人
			// goods.price = buildMiaoshaPrice(miaosha.price, miaosha)
			goods.price = miaosha.price;
		}
		// //判断秒杀与规格的关系
		// if (!goods.sku_id || !miaosha.sku_id || goods.sku_id == miaosha.sku_id) {
		// 	if (!goods.market_price) {
		// 		goods.market_price = goods.price
		// 	}
		// 	miaosha.origin_price = goods.price;
		// 	//如果存在规格，则修改规格的价格

		// }
	} else {
		//已过期了，就删除掉吧 
		delete goods.miaosha;
	}
}
/**
 * 统一计算秒杀价格，将来可能接入一口价
 * @param {*} price 
 * @param {*} miaosha 
 */
function buildMiaoshaPrice(price, miaosha) {
	//存在一口价
	if (miaosha.price) {
		return miaosha.price;
	}
	//计算折扣
	return parseInt(price * miaosha.discount / 100)
}
