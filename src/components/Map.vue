<template>
	<div class="com-container" @dblclick="revertMap">
		<div class="com-chart" ref="map_ref"></div>
	</div>
</template>

<script>
import axios from "axios";
import { getProvinceMapInfo } from "@/utils/map_utils";
import { mapState } from "vuex";

export default {
	name: "Map",
	data() {
		return {
			chartInstance: null,
			allData: null, //从服务器中获取的所有数据
			mapData: {}, //获取省份地图数据的缓存
		};
	},
	created() {
		//在组件创建完成后，进行回调函数的注册
		this.$socket.registerCallback("mapData", this.getData);
	},
	mounted() {
		this.initChart();
		// this.getData();
		//发送数据给服务器，告诉服务器，我现在需要数据
		this.$socket.send({
			action: "getData",
			socketType: "mapData",
			chartName: "map",
			value: "",
		});
		window.addEventListener("resize", this.screenAdapter);
		this.screenAdapter();
	},
	destroyed() {
		window.removeEventListener("resize", this.screenAdapter);
		//在组件销毁的时候，进行回调函数的取消
		this.$socket.unRegisterCallback("mapData");
	},
	computed: {
		// 使用对象展开运算符将 vuex state中 theme 混入 computed 对象中
		...mapState(["theme"]),
	},
	watch: {
		theme() {
			// console.log("主题切换了");
			this.chartInstance.dispose(); //销毁当前的图表
			this.initChart(); //重新以最新的主题名称初始化图表对象
			this.screenAdapter(); //完成屏幕的适配
			this.updateChart(); //更新图表的展示
		},
	},
	methods: {
		async initChart() {
			this.chartInstance = this.$echarts.init(this.$refs.map_ref, this.theme);
			//获取中国地图的矢量数据
			const ret = await axios.get(
				"http://localhost:8999/static/map/china.json"
			);
			// console.log(ret);
			//注册地图
			this.$echarts.registerMap("china", ret.data);
			const initOption = {
				title: {
					text: "⎮ 商家分布",
					left: 20,
					top: 20,
				},
				geo: {
					type: "map",
					map: "china",
					top: "5%",
					bottom: "5%",
					itemStyle: {
						areaColor: "#2e72bf",
						borderColor: "#333",
					},
				},
				legend: {
					left: "5%",
					bottom: "5%",
					orient: "vertical", //图例摆放：垂直分布
				},
			};
			this.chartInstance.setOption(initOption);
			this.chartInstance.on("click", async (arg) => {
				// arg.name 得到所点击的省份名，这个省份名是中文
				// console.log(arg);
				const provinceInfo = getProvinceMapInfo(arg.name);
				// console.log(provinceInfo);
				//获取省份地图的矢量数据
				//判断 mapData对象中是否存在请求省份地图的缓存数据
				if (!this.mapData[provinceInfo.key]) {
					const ret = await axios.get(
						"http://localhost:8999/" + provinceInfo.path
					);
					this.mapData[provinceInfo.key] = ret.data;
					this.$echarts.registerMap(provinceInfo.key, ret.data);
				}

				const mapOption = {
					geo: {
						map: provinceInfo.key,
					},
				};
				this.chartInstance.setOption(mapOption);
			});
		},
		getData(ret) {
			// const { data: ret } = await this.$http.get("map");
			this.allData = ret;
			// console.log(this.allData);
			this.updateChart();
		},
		updateChart() {
			//处理图表需要的数据
			const seriesArr = this.allData.map((item) => {
				// return 的这个对象就代表的是一个类别下所有散点数据
				return {
					type: "effectScatter",
					rippleEffect: {
						scale: 5,
						brushType: "stroke", //涟漪空心效果
					},
					name: item.name,
					data: item.children,
					coordinateSystem: "geo", //地图中显示散点的配置
				};
			});
			//图例的数据
			const legendArr = this.allData.map((item) => {
				return item.name;
			});
			const dataOption = {
				legend: {
					data: legendArr,
				},
				series: seriesArr,
			};
			this.chartInstance.setOption(dataOption);
		},
		screenAdapter() {
			const titleFontSize = (this.$refs.map_ref.offsetWidth / 100) * 3.6;
			const adapterOption = {
				title: {
					textStyle: {
						fontSize: titleFontSize,
					},
				},
				legend: {
					itemWidth: titleFontSize / 2,
					itemHeight: titleFontSize / 2,
					itemGap: titleFontSize / 2,
					textStyle: {
						fontSize: titleFontSize / 2,
					},
				},
			};
			this.chartInstance.setOption(adapterOption);
			this.chartInstance.resize(); //控制图表自适应
		},
		//回到中国地图的点击事件
		revertMap() {
			const revertOption = {
				geo: {
					map: "china",
				},
			};
			this.chartInstance.setOption(revertOption);
		},
	},
};
</script>
<style scoped>
</style>
