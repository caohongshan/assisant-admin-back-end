const { Controller } = require('../common/uni-cloud-router')

module.exports = class UtilsController extends Controller {
	/**
	 * 地址解析（地址转坐标）
	 * @param {Object} address 详细地址
	 * @param {Object} region 地区（选填）
	 * @link https://lbs.qq.com/service/webService/webServiceGuide/webServiceGeocoder
	 */
	async getAddressGeo() {
		return false;
	}
	/**
	 * 逆地址解析（坐标位置描述）
	 * @param {Object} fromLatlng
	 * @param {Object} poi_options
	 * @link https://lbs.qq.com/service/webService/webServiceGuide/webServiceGcoder
	 */
	async getLocationAddress() {
		return false;
	}
	/**
	 * 根据经纬度，计算距离，如果需要在结算的时候，保证距离万无一失，就需要调用此接口，如果信任前端传过来的距离参数，就没必要调用
	 * @param {Object} fromLatlng 起点坐标
	 * @param {Object} toLatlng 终点坐标
	 * @link https://lbs.qq.com/service/webService/webServiceGuide/webServiceMatrix
	 */
	async getMapDistance() {
		//查询失败
		return false;
	}
}
