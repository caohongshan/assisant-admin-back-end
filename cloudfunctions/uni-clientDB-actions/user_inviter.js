// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const cmd = db.command;
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let inviter = []
		result.data.forEach(item => {
			//统一查询一次上级
			if (item.inviter_uid && item.inviter_uid.length > 0) {
				inviter.push(item.inviter_uid[0]);
			}
			item.nickname = item.nickname ? item.nickname : "未填写"
			item.inviter = {}
			if (!item.avatar) {
				item.avatar = "/static/missing-face.png"
			}
		})
		if (inviter.length > 0) {
			//查询邀请者
			let inviterResult = await db.collection("uni-id-users").where({
				_id: cmd.in(inviter)
			}).field({
				nickname: 1,
				mobile: 1,
				avatar: 1
			}).get();
			if (inviterResult.data.length > 0) {
				let parMap = {};
				inviterResult.data.map(e => {
					if (!e.nickname) {
						e.nickname = "未填写"
					}
					if (!e.avatar) {
						e.avatar = "/static/missing-face.png"
					}
					parMap[e._id] = e;
				})
				result.data.forEach(item => {
					if (item.inviter_uid && item.inviter_uid.length > 0) {
						item.inviter = parMap[item.inviter_uid[0]] ? parMap[item.inviter_uid[0]] :
							false;
					}
				})
			}
		}

		return result
	}
}
