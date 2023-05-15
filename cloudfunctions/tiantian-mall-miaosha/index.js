'use strict';
const db = uniCloud.database()
const cmd = db.command;
const hourMiaoshaCollection = db.collection("tian-mall-hour-miaosha")
const hourMiaoshaGoodsCollection = db.collection("tian-mall-hour-miaosha-goods")
const goodsCollection = db.collection("opendb-mall-goods")
const skuCollection = db.collection("opendb-mall-sku")
const {
	getTodayTime,
	getNowHours
} = require('./util');
let redis;
//每小时自动处理秒杀数据
exports.main = async (event, context) => {
	//event为客户端上传的参数
	try {
		redis = uniCloud.redis()
	} catch (e) {
		console.error("系统未开通redis高速缓存")
	}
	/* //整套秒杀逻辑：
	1. 提前10分钟把秒杀库存写到对应整点的缓存中，key=miaosha+开始时间点，有效期是最大秒杀结束时间，这样能保证这些秒杀的库存一定是的对的，采用redis的有序集合，将来使用增量接口，来控制库存，添加的时候，一次性增加
	2. 提交订单的时候，判断秒杀商品是否生效，如果生效，则在submit的时候，redis减少库存，返回值为-1则证明卖光了
	3. 如果同一个订单存在多个秒杀，并且有些秒杀商品的redis是-1返回值，则其他成功的商品实现回滚操作
	4. 如果秒杀商品遇到未支付取消订单，则增加redis库存（此时实际库存未发生减少操作），如果已付款后再取消，则不增加redis库存，也不增加实际库存
	*/
	//整点秒杀，需要提前10分钟处理数据
	let prevTime = 10 * 60 * 1000;
	const {
		data: hourData
	} = await hourMiaoshaCollection.where(
		cmd.or({
			end_time: 0
		}, {
			end_time: cmd.gte(Date.now() + prevTime)
		}).and({
			state: 1,
		})).orderBy("posid", "asc").get();
	if (hourData.length == 0) {
		return "没有秒杀时段";
	}
	if (event.miaosha_id && event.miaosha_goods_id) {
		let miaosha = hourData.filter(e => e._id == event.miaosha_id)[0];
		//查询此场次的商品
		const {
			data: goodsData
		} = await hourMiaoshaGoodsCollection.doc(event.miaosha_goods_id).get();

		//快速更新某一个商品的秒杀信息
		if (goodsData.length > 0) {
			await updateGoodsInfo({
				...miaosha,
				...miaosha.todayTime
			}, goodsData[0]);
		}
		return;
	}
	//时段秒杀的商品不能重复，否则会覆盖之前的
	//最后一条的结束时间是今日的24点
	let todayBeginTime = getTodayTime(0, true);
	let tomorrowBeginTime = getTodayTime(1, true);
	let afterTomorrowBeginTime = getTodayTime(2, true);
	let hour = getNowHours()
	//如果时段小于当前，则生成第二天数据
	//处理开始时间
	let miaoshaList = []

	hourData.map((miaosha, index) => {
		miaosha.isLast = index == hourData.length - 1
		//开始时间戳
		miaoshaList.push({
			...miaosha,
			endTime: miaosha.isLast ? tomorrowBeginTime : 0,
			beginTime: todayBeginTime + miaosha.hour * 3600 * 1000
		})
	})

	//处理每个时段的结束时间
	miaoshaList.forEach((miaosha, index) => {
		if (!miaosha.isLast) {
			miaosha.endTime = miaoshaList[index + 1].beginTime - 1000;
		}
	})

	for (let i = 0; i < miaoshaList.length; i++) {
		let miaosha = miaoshaList[i];
		//批量更新原来秒杀的状态为失效
		await goodsCollection.where({
			"miaosha.miaosha_id": miaosha._id
		}).update({
			miaosha: cmd.remove()
		});
		//查询此场次的商品
		const {
			data: goodsData
		} = await hourMiaoshaGoodsCollection.where(cmd.or({
			end_time: 0
		}, {
			end_time: cmd.gte(Date.now())
		}).and({
			begin_time: cmd.lte(Date.now() + prevTime),
			miaosha_id: miaosha._id
		})).orderBy("begin_time", "desc").limit(500).get();
		//查询所有sku的价格
		// let skuPriceMap = await getSkuPriceByIds(goodsData.filter(e => e.sku_id).map(e => e.sku_id))
		// console.log(goodsData)
		for (let j = 0; j < goodsData.length; j++) {
			let goodsMiaosha = goodsData[j];
			await updateGoodsInfo(miaosha, goodsMiaosha);
		}

		//更新当天的秒杀信息
		await hourMiaoshaCollection.doc(miaosha._id).update({
			goodsCount: goodsData.length,
			todayTime: {
				begin_time: miaosha.beginTime,
				end_time: miaosha.endTime,
			}
		})
	}
	//返回数据给客户端
	return miaoshaList
};

async function updateGoodsInfo(miaosha, goodsMiaosha) {
	//更新数据到商品表
	let miaoshaUpdateData = {
		enable: true, //有效秒杀
		miaosha_id: miaosha._id,
		miaosha_goods_id: goodsMiaosha._id,
		sale_count: miaosha.sale_count ? miaosha.sale_count : 0, //已售数量
		begin_time: miaosha.beginTime,
		end_time: miaosha.endTime,
		price: goodsMiaosha.price,
		market_price: goodsMiaosha.market_price,
		sku_id: goodsMiaosha.sku_id,
		discount: goodsMiaosha.discount,
		is_limit: goodsMiaosha.is_limit,
		limit_stock: goodsMiaosha.limit_stock, //秒杀库存，如果为空，则前端以商品库存为准
		limit_order_count: goodsMiaosha.limit_order_count,
		limit_user_count: goodsMiaosha.limit_user_count
	}
	// if (goodsMiaosha.sku_id) {
	// 	miaoshaUpdateData.sku_id = goodsMiaosha.sku_id
	// 	//规格的价格，与商品的price可能不一致
	// 	miaoshaUpdateData.price = buildMiaoshaPrice(skuPriceMap[goodsMiaosha.sku_id], goodsMiaosha)
	// 	miaoshaUpdateData.market_price = skuPriceMap[goodsMiaosha.sku_id];
	// } else {
	// 	miaoshaUpdateData.price = buildMiaoshaPrice(0, goodsMiaosha)
	// }
	//多规格情况下，外边显示的不是最低一个价格
	await goodsCollection.doc(goodsMiaosha.goods_id).update({
		miaosha: miaoshaUpdateData
	})
}

/**
 * 获取sku的价格
 * @param {Array} ids 
 */
async function getSkuPriceByIds(ids) {
	const {
		data
	} = await skuCollection.where({
		_id: cmd.in(ids)
	}).field({
		price: 1
	}).get();
	return data.reduce((pre, sku) => {
		pre[sku._id] = sku.price;
		return pre;
	}, {})
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
	return parseInt(price * miaosha.discount / 100)
}
