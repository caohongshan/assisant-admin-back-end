/**
 * 中国时差
 */
let timeZone = 8;

/**
 * 获取当天时间戳，写入数据和取出数据，不需要增加时差
 */
function getTodayTime(day = 0, check = false) {
	let time = new Date();
	time.setMinutes(0);
	time.setSeconds(0);
	time.setMilliseconds(0)
	if (check) {
		//由于时差问题，我们的0点，是utc的前一天16点
		time.setHours(time.getHours() + timeZone);
		time.setHours(timeZone * -1);
	} else {
		time.setHours(0);
	}
	if (day != 0) {
		time.setDate(time.getDate() + day);
	}
	console.log("getTodayTime", day, check, time.getTime())
	return time.getTime();
}

/**
 * 根据时间戳，获得日期，存在8小时时差
 */
function getDateByTime(timestamp) {
	let time;
	if (timestamp) {
		time = new Date(timestamp);
	} else {
		time = new Date();
	}
	time.setHours(timeZone);
	return time.getDate();
}
/**
 * 获取当前的小时数，存在8小时时差
 */
function getNowHours() {
	let time = new Date();
	time.setHours(time.getHours() + timeZone);
	return time.getHours();
}

/**
 * 格式化时间戳 Y-m-d H:i:s
 * @param {String} format Y-m-d H:i:s
 * @param {Number} timestamp 时间戳   
 * @return {String}
 */
function dateFormat(format, timeStamp) {
	let _date;
	if (!timeStamp) {
		_date = new Date();
	} else {
		if (isNaN(timeStamp)) {

		} else if ('' + timeStamp.length <= 10) {
			timeStamp = +timeStamp * 1000;
		} else {
			timeStamp = +timeStamp;
		}
		_date = new Date(timeStamp);
	}
	//处理时差问题
	_date.setHours(_date.getHours() + timeZone);
	let Y = _date.getFullYear(),
		m = _date.getMonth() + 1,
		d = _date.getDate(),
		H = _date.getHours(),
		i = _date.getMinutes(),
		s = _date.getSeconds();
	//周
	let week = {
		"0": "日",
		"1": "一",
		"2": "二",
		"3": "三",
		"4": "四",
		"5": "五",
		"6": "六"
	};
	if (/(E+)/.test(format)) {
		format = format.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "星期" : "周") : "") +
			week[_date
				.getDay() + ""]);
	}
	m = m < 10 ? '0' + m : m;
	d = d < 10 ? '0' + d : d;
	H = H < 10 ? '0' + H : H;
	i = i < 10 ? '0' + i : i;
	s = s < 10 ? '0' + s : s;

	return format.replace(/[YmdHis]/g, key => {
		return {
			Y,
			m,
			d,
			H,
			i,
			s
		} [key];
	});
}

function getObjectValue(info, fields = []) {
	if (fields.length > 0) {
		return fields.reduce(function(pre, key) {
			pre[key] = info[key]
			return pre;
		}, {})
	}
	return info;
}

/**
 * 动态处理缩略图，居中短边裁剪
 * @param {Object} value
 * @param {Object} fmt 宽x高 200x200
 */
function thumbImg(value, fmt, func) {
	if (!fmt) {
		fmt = "200x200";
	}
	if (!value) {
		return "/static/errorImage.jpg"
	}
	//可能出现地址里面有问号
	if (value.indexOf("?") > 0) {
		let [path, query] = value.split("?");
		value = path;
	}
	fmt = fmt.toLowerCase();
	if (value.indexOf("bspapp.com") > -1) {
		let wh = fmt.split("x");
		fmt = `w_${wh[0]}`;
		if (wh[1]) {
			fmt += `,h_${wh[1]}`
			func = "m_fill"
		}
		//阿里云?x-oss-process=image/resize,m_fill,w_300,h_300
		return [value, `?x-oss-process=image/resize,${func},`, fmt].join("");
	} else if (value.indexOf("qcloud.la") > -1) {
		if (!func) {
			func = "crop"
		}
		if (func == "thumb") {
			func = "thumbnail"
		}
		//腾讯云?imageMogr2/crop/300x300/gravity/center
		return [value, `?imageMogr2/${func}/`, fmt, "/gravity/center"].join("");
	} else if (value.indexOf("7.nbgaofang.cn") > -1) {
		//七牛云?imageView2/1/w/200/h/200/q/75
		let wh = fmt.split("x");
		fmt = `w/${wh[0]}/h/${wh[1]}`;
		return [value, "?imageView2/1/", fmt, "/q/75"].join("");
	} else if (value.indexOf("360buyimg.com") > -1) {
		//京东采集图片，去水印https://www.qyzhsm.cn/down/showdownload.php?id=21
		return value.replace(/s(\d+)x(\d+)/, `s${fmt}`).replace(/\.com\/(.*)\/s/g, ".com/imgzone/s").replace(
			/\.com\/(.*)\/jfs/g, ".com/imgzone/jfs")
	} else if (value.indexOf("img.jxhh.com") > -1) {
		//聚合供应链
		//https://img.jxhh.com/ewei_shop_5fd72fe3bf0f3?imageMogr2/thumbnail/60x/strip/quality/75/format/jpg
		let wh = fmt.split("x");
		let maxWidth = Math.max(...wh);
		return [value, "?imageMogr2/thumbnail/", maxWidth, "x/strip/quality/75/format/jpg"].join("");
	}
	return value;
}

const _toString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty

// copy from lodash
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g
var reHasRegExpChar = RegExp(reRegExpChar.source)

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
function escapeRegExp(string) {
	return (string && reHasRegExpChar.test(string)) ?
		string.replace(reRegExpChar, '\\$&') :
		string
}

function replaceAll(str, substr, newSubstr) {
	return str.replace(new RegExp(escapeRegExp(substr), 'g'), newSubstr)
}

function hasOwn(obj, key) {
	return hasOwnProperty.call(obj, key)
}

function isPlainObject(obj) {
	return _toString.call(obj) === '[object Object]'
}

function isFn(fn) {
	return typeof fn === 'function'
}

function isPromise(obj) {
	return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

function getType(val) {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase()
}

function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj))
}

// 简单实现，忽略数组等情况
function getObjectValue2(obj, keyPath) {
	const keyPathArr = keyPath.split('.')
	return keyPathArr.reduce((value, key) => {
		return value && value[key]
	}, obj)
}

// 获取文件后缀，只添加几种图片类型供客服消息接口使用
const mime2ext = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/svg+xml': 'svg',
	'image/bmp': 'bmp',
	'image/webp': 'webp'
}

function getExtension(contentType) {
	return mime2ext[contentType]
}

const isSnakeCase = /_(\w)/g
const isCamelCase = /[A-Z]/g

function snake2camel(value) {
	return value.replace(isSnakeCase, (_, c) => (c ? c.toUpperCase() : ''))
}

function camel2snake(value) {
	//首字母不转换@@@微信第三方平台接口返回的参数首字母是大写，所以这里需要排除首字母
	return value.replace(/^[A-Z]/, str => str.toLowerCase()).replace(isCamelCase, str => '_' + str.toLowerCase())
}

function parseObjectKeys(obj, type) {
	let parserReg, parser
	switch (type) {
		case 'snake2camel':
			parser = snake2camel
			parserReg = isSnakeCase
			break
		case 'camel2snake':
			parser = camel2snake
			parserReg = isCamelCase
			break
	}
	for (const key in obj) {
		if (hasOwn(obj, key)) {
			if (parserReg.test(key)) {
				const keyCopy = parser(key)
				obj[keyCopy] = obj[key]
				delete obj[key]
				if (isPlainObject(obj[keyCopy])) {
					obj[keyCopy] = parseObjectKeys(obj[keyCopy], type)
				} else if (Array.isArray(obj[keyCopy])) {
					obj[keyCopy] = obj[keyCopy].map((item) => {
						return parseObjectKeys(item, type)
					})
				}
			}
		}
	}
	return obj
}

function snake2camelJson(obj) {
	return parseObjectKeys(obj, 'snake2camel')
}

function camel2snakeJson(obj) {
	return parseObjectKeys(obj, 'camel2snake')
}

function getOffsetDate(offset) {
	return new Date(
		Date.now() + (new Date().getTimezoneOffset() + (offset || 0) * 60) * 60000
	)
}

function getDateStr(date, separator = '-') {
	date = date || new Date()
	const dateArr = []
	dateArr.push(date.getFullYear())
	dateArr.push(('00' + (date.getMonth() + 1)).substr(-2))
	dateArr.push(('00' + date.getDate()).substr(-2))
	return dateArr.join(separator)
}

function getTimeStr(date, separator = ':') {
	date = date || new Date()
	const timeArr = []
	timeArr.push(('00' + date.getHours()).substr(-2))
	timeArr.push(('00' + date.getMinutes()).substr(-2))
	timeArr.push(('00' + date.getSeconds()).substr(-2))
	return timeArr.join(separator)
}

function getFullTimeStr(date) {
	date = date || new Date()
	return getDateStr(date) + ' ' + getTimeStr(date)
}

function log() {
	if (process.env.NODE_ENV === 'development') {
		console.log(...arguments)
	}
}

function getSmsCode(len = 6) {
	let code = ''
	for (let i = 0; i < len; i++) {
		code += Math.floor(Math.random() * 10)
	}
	return code
}

function getDistinctArray(arr) {
	return Array.from(new Set(arr))
}

// 暂时实现到这种程度，后续有需求时再调整
function resolveUrl(base, path) {
	if (/^https?:/.test(path)) {
		return path
	}
	return base + path
}

function mergeLanguage(lang1, lang2) {
	const localeList = Object.keys(lang1)
	localeList.push(...Object.keys(lang2))
	const result = {}
	for (let i = 0; i < localeList.length; i++) {
		const locale = localeList[i]
		result[locale] = Object.assign({}, lang1[locale], lang2[locale])
	}
	return result
}

function buildMenu(menu, menuList, menuIds) {
	let nextLayer = []
	for (let i = menu.length - 1; i > -1; i--) {
		const currentMenu = menu[i]
		const subMenu = menuList.filter(item => {
			if (item.parent_id === currentMenu.menu_id) {
				menuIds.push(item.menu_id)
				return true
			}
		})
		nextLayer = nextLayer.concat(subMenu)
		currentMenu.children = subMenu
	}
	if (nextLayer.length) {
		buildMenu(nextLayer, menuList, menuIds)
	}
}

function getParentIds(menuItem, menuList) {
	const parentArr = []
	let currentItem = menuItem
	while (currentItem && currentItem.parent_id) {
		parentArr.push(currentItem.parent_id)
		currentItem = menuList.find(item => item.menu_id === currentItem.parent_id)
	}
	return parentArr
}

function buildMenus(menuList, trim = true) {
	// 保证父子级顺序
	menuList = menuList.sort(function(a, b) {
		const parentIdsA = getParentIds(a, menuList)
		const parentIdsB = getParentIds(b, menuList)
		if (parentIdsA.includes(b.menu_id)) {
			return 1
		}
		return parentIdsA.length - parentIdsB.length || a.sort - b.sort
	})
	// 删除无subMenu且非子节点的菜单项
	if (trim) {
		for (let i = menuList.length - 1; i > -1; i--) {
			const currentMenu = menuList[i]
			const subMenu = menuList.filter(subMenuItem => subMenuItem.parent_id === currentMenu.menu_id)
			if (!currentMenu.isLeafNode && !subMenu.length) {
				menuList.splice(i, 1)
			}
		}
	}
	const menuIds = []
	const menu = menuList.filter(item => {
		if (!item.parent_id) {
			menuIds.push(item.menu_id)
			return true
		}
	})
	buildMenu(menu, menuList, menuIds)
	// 包含所有无效菜单
	if (!trim && menuIds.length !== menuList.length) {
		menu.push(...menuList.filter(item => !menuIds.includes(item.menu_id)))
	}
	return menu
}

module.exports = {
	buildMenu,
	buildMenus,
	getTodayTime,
	getDateByTime,
	getNowHours,
	dateFormat,
	thumbImg,
	getObjectValue,
	getObjectValue2,
	escapeRegExp,
	replaceAll,
	hasOwn,
	isPlainObject,
	isFn,
	isPromise,
	getType,
	deepClone,
	mime2ext,
	getExtension,
	snake2camel,
	camel2snake,
	snake2camelJson,
	camel2snakeJson,
	getOffsetDate,
	getDateStr,
	getTimeStr,
	getFullTimeStr,
	getSmsCode,
	getDistinctArray,
	resolveUrl,
	mergeLanguage
}
