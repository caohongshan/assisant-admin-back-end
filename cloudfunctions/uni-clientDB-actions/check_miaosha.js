// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const {
	getTodayTime,
	getNowHours
} = require("tiantian-common")
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
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

		result.data.map((miaosha, index) => {
			miaosha.isLast = index == result.data.length - 1
			//开始时间戳
			miaoshaList.push({
				...miaosha,
				end_time: miaosha.isLast ? tomorrowBeginTime : 0,
				begin_time: todayBeginTime + miaosha.hour * 3600 * 1000
			})
		})
		//处理每个时段的结束时间
		miaoshaList.forEach((miaosha, index) => {
			if (!miaosha.isLast) {
				miaosha.end_time = miaoshaList[index + 1].begin_time - 1000;
			}
		})
		result.data = miaoshaList.filter(e => e.end_time > Date.now() || e.isLast);
		return result
	}
}
