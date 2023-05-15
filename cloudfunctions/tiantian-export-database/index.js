'use strict';
const fs = require("fs")
const path = require('path')
const db = uniCloud.database();
/**
 * 本地执行云函数，生成db_init.json，外网无法访问
 */
exports.main = async (event, context) => {
	const {
		SPACEINFO
	} = context;
	let origin = require('./db_init_origin.json')
	//event为客户端上传的参数
	let collections = Object.keys(origin);
	/**
	 * 导出所有数据的表
	 */
	let allDataCollection = ["opendb-admin-menus", "opendb-banner", "opendb-banner-category", "opendb-app-list",
		"tian-mall-categories",
		"opendb-city-china", "opendb-mall-categories", "opendb-mall-goods", "opendb-mall-sku",
		"opendb-news-articles", "opendb-news-categories", "tian-identity", "tian-page-components",
		"tian-pages", "tian-payment-types", "uni-id-permissions", "uni-id-roles", "tian-mall-shops",
		"tian-platforms", "tian-redbag"
	]
	let delete_ids = ["opendb-admin-menus", "opendb-banner", "opendb-app-list", "opendb-city-china",
		"opendb-news-articles", "tian-identity", "tian-page-components", "tian-payment-types",
		"uni-id-permissions", "uni-id-roles", "tian-platforms", "tian-redbag"
	]
	//默认无数据
	collections.map(e => {
		origin[e].data = []
	})
	//生成一个只有描述的db
	fs.writeFileSync(path.resolve(__dirname, '../../database/db_init_admin.json'), JSON.stringify(origin))
	console.log("写入admin完成")

	for await (let coll of allDataCollection) {
		//查询数据，默认只查询了100条
		origin[coll].data = await getDataByPage(coll, 1);
		console.log(`${coll}导出完成`)
		//转化为支持腾讯云的结构，在id后面增加一位，需要处理外键
		origin[coll].data.forEach(e => {
			if (delete_ids.indexOf(coll) != -1) {
				//删除_id
				delete e._id;
			}
			//腾讯云空间的id不需要转换
			if (SPACEINFO && SPACEINFO.provider != "tencent") {
				formatObjectId(e)
			}
		})
	}
	console.log("全部导出完成")
	fs.writeFileSync(path.resolve(__dirname, '../../database/db_init.json'), JSON.stringify(origin))
	console.log("写入完成")
	return origin;
};

const getDataByPage = async (coll, page, limit = 500) => {
	let {
		data
	} = await db.collection(coll).skip((page - 1) * limit).limit(500).get();
	if (data.length == limit) {
		data = data.concat(await getDataByPage(coll, page + 1, limit))
	}
	return data;
}
let regex = /^[a-z0-9]{24}$/
let ext = "0";
const formatObjectId = (obj) => {
	for (let key in obj) {
		if (obj[key] && obj[key].toString() == "[object Object]") {
			formatObjectId(obj[key])
		} else if (regex.test(obj[key])) {
			//可能是主键和外键,增加一个字符串0，如果已经被加了0，则不受影响
			obj[key] = obj[key] + ext
		}
	}
}

/**
 * 判断变量的类型，返回object，array，string，number，boolean
 */
const getType = (val) => {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase()
}
