// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
module.exports = {
	before: async (state, event) => {
		state.newData.id = await genIdentityId(state.collection);
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		return result
	}
}
const db = uniCloud.database();
const cmd = db.command;
const identityCollection = db.collection("tian-identity");
const genIdentityId = async function(key, inc) {
	//生成用户id----开始-----
	inc = inc ? +inc : 1;
	let res = await identityCollection.where({
		key
	}).updateAndReturn({
		value: cmd.inc(inc)
	});
	if (res.updated == 0) {
		let value = 10000;
		await identityCollection.add({
			key,
			value
		});
		return value;
	}
	//生成用户id----结束-----
	return res.doc.value;
}
