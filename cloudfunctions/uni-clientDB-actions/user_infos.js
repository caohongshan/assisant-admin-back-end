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
		//,nickname,mobile,avatar,id
		let uids = result.data.map(e => e.user_id);
		let {
			data
		} = await db.collection("uni-id-users").where({
			_id: cmd.in(uids)
		}).field({
			nickname: 1,
			mobile: 1,
			id: 1,
			avatar: 1
		}).get();

		let userMap = data.reduce((total, item) => {
			total[item._id] = item;
			return total;
		}, {});

		let inviter = []
		result.data = result.data.map(item => {
			Object.assign(item, {
				...userMap[item.user_id]
			})
			item.nickname = item.nickname ? item.nickname : "未填写"
			if (!item.avatar) {
				item.avatar = "/static/missing-face.png"
			}
			return item;
		})
		return result
	}
}
