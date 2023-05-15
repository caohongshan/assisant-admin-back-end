// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
module.exports = {
	before: async (state, event) => {

	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let remark = "";
		let id = state.newData.id;
		let type = "channel_apply"
		if (state.newData.status == 2) {
			type = "channel_apply_result"
			remark = "点击查看推广二维码"
			//更新用户channel_code
			if (state.newData.user_id) {
				await db.collection("uni-id-users").doc(state.newData.user_id).update({
					channel_code: state.newData.id
				})
			}
		} else if (state.newData.status == 3) {
			//拒绝
			type = "channel_apply_result"
			remark = "资料不全"
		}
		let callFunctionResult = await uniCloud.callFunction({
			name: "tiantian-mall",
			data: {
				action: "app/message",
				data: {
					...state.newData,
					remark,
					type,
					_id: result.id
				}
			}
		})
		return result
	}
}
