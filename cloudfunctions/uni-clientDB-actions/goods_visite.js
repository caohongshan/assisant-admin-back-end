// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
const visiteCollection = db.collection("tian-mall-visit");
const goodsCollection = db.collection("opendb-mall-goods");
const {
	getShopInfoById,
	getShopInfoUpdateSellCountById,
	getTodayTime
} = require("tiantian-common")
module.exports = {
	before: async (state, event) => {
		let fields = state.command.getParam({
			name: 'field',
			index: 0
		})[0]
		//最后更新销售数量的日期
		fields["last_update_sell_date"] = 1;
		//每日销售日志
		fields["day_sales"] = 1;
		state.command.setParam({
			name: 'field',
			index: 0,
			param: [fields]
		})
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		const {
			uid
		} = state.auth;
		//判断封面图是否与大图一致，
		/* if (result.data.goods_banner_imgs && result.data.goods_banner_imgs.length > 0 && result.data
			.goods_thumb && result.data.goods_banner_imgs[0] == result.data
			.goods_thumb) {
			result.data.goods_banner_imgs.shift();
		} */
		//更新月售
		let updates = await updateMonthSales(result)
		//只有单条访问，才记录浏览量
		await checkGoodsVisite(uid, result.data, updates);
		await getShopInfo(result)
		return result
	}
}

//更新商品月售，每日首次访问更新统计
const updateMonthSales = async (result) => {
	let today = getTodayTime(0, 1)
	let begin = getTodayTime(-30, 1)
	let totalDay = getTodayTime(-60, 1)
	let updates = {}
	if (result.data.day_sales) {
		if (!result.data.last_update_sell_date || result.data.last_update_sell_date != today) {
			//提取30天的记录	//提取有用的日期
			let days = Object.keys(result.data.day_sales).filter(e => e >= begin);
			let total = days.reduce((pre, d) => {
				return pre + Number(result.data.day_sales[d]);
			}, 0)
			//@todo 删除没用的日志
			//保留1年内的销售日志
			day_sales = Object.keys(result.data.day_sales).filter(e => e >= totalDay).reduce((pre, d) => {
				pre[d] = result.data.day_sales[d]
				return pre;
			}, {})
			//更新数据库
			updates = {
				month_sell_count: total,
				last_update_sell_date: today,
				day_sales: cmd.set(day_sales)
			}
			//更新月售
			result.data.month_sell_count = total;
		}
	}
	//不需要反馈给前端
	delete result.data.day_sales
	return updates;
}

const getShopInfo = async (result) => {
	//查询店铺信息
	let shopid = result.data.shop_id;
	if (shopid) {
		console.log("开始查询店铺信息", shopid)
		result.data.shop = await getShopInfoUpdateSellCountById(shopid)
		//如果店铺已关闭，则商品自动下架
		result.data.shop.enable = result.data.shop.state && result.data.shop.online
		//商品的销售状态跟随店铺
		if (!result.data.shop.enable) {
			result.data.is_on_sale = result.data.shop.enable;
		}
	}
}
/**
 * 根据用户信息，判断商品会员折扣
 */
const checkGoodsVisite = async (uid, data, updates) => {
	let id = data._id
	if (!uid || !id) {
		return false;
	}
	let res = await visiteCollection.where({
		id: id,
		type: "goods",
		user_id: uid
	}).update({
		create_date: Date.now()
	})
	await goodsCollection.doc(id).update({
		visite_count: cmd.inc(1),
		...updates
	})
	if (res.updated == 0) {
		//新增
		await visiteCollection.add({
			title: data.name,
			avatar: data.goods_thumb,
			description: data.goods_summary,
			price: data.price,
			id: id,
			type: "goods",
			user_id: uid,
			create_date: Date.now(),
		})
	}
	//更新时间
	return res;
}
