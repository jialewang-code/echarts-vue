<template>
	<div class="com-container">
		<div class="com-chart" ref="hot_ref"></div>
		<span class="iconfont arr-left" @click="toLeft" :style="comStyle"
			>&#xe6ef;</span
		>
		<span class="iconfont arr-right" @click="toRight" :style="comStyle"
			>&#xe6ed;</span
		>
		<span class="cate-name" :style="comStyle">{{ cateName }}</span>
	</div>
</template>

<script>
import { mapState } from "vuex";
import { getThemeValue } from "@/utils/theme_utils";

export default {
	name: "Hot",
	data() {
		return {
			chartInstance: null,
			allData: null, //从服务器中获取的所有数据
			currentIndex: 0, //当前展示的一级分类数据
			titleFontSize: 0,
		};
	},
	created() {
		//在组件创建完成后，进行回调函数的注册
		this.$socket.registerCallback("hotproductData", this.getData);
	},
	mounted() {
		this.initChart();
		// this.getData();
		//发送数据给服务器，告诉服务器，我现在需要数据
		this.$socket.send({
			action: "getData",
			socketType: "hotproductData",
			chartName: "hotproduct",
			value: "",
		});
		window.addEventListener("resize", this.screenAdapter);
		this.screenAdapter();
	},
	destroyed() {
		window.removeEventListener("resize", this.screenAdapter);
		//在组件销毁的时候，进行回调函数的取消
		this.$socket.unRegisterCallback("hotproductData");
	},
	computed: {
		cateName() {
			if (!this.allData) {
				return "";
			} else {
				return this.allData[this.currentIndex].name;
			}
		},
		comStyle() {
			return {
				fontSize: this.titleFontSize + "px",
				color: getThemeValue(this.theme).titleColor,
			};
		},
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
		initChart() {
			this.chartInstance = this.$echarts.init(this.$refs.hot_ref, this.theme);
			const initOption = {
				title: {
					text: "⎮ 热销商品的占比",
					top: 20,
					left: 20,
				},
				legend: {
					top: "15%",
					icon: "circle",
				},
				tooltip: {
					show: true,
					formatter: (arg) => {
						//arg里的内容包含series->data数据内容
						// console.log(arg);
						const thirdCategory = arg.data.children;
						//计算出所有三级分类数据的总和
						let total = 0;
						thirdCategory.forEach((item) => {
							total += item.value;
						});
						let retStr = "";
						thirdCategory.forEach((item) => {
							retStr += `
              ${item.name}:${parseInt((item.value / total) * 100) + "%"}
              <br/>
              `;
						});
						return retStr;
					},
				},
				series: [
					{
						type: "pie",
						label: {
							show: false,
						},
						emphasis: {
							//高亮显示
							label: {
								show: true,
							},
							labelLine: {
								show: false,
							},
						},
					},
				],
			};
			this.chartInstance.setOption(initOption);
		},
		getData(ret) {
			// const { data: ret } = await this.$http.get("hotproduct");
			this.allData = ret;
			// console.log(this.allData);
			this.updateChart();
		},
		updateChart() {
			//处理获取数据
			//获取一个分类下的数据
			const seriesData = this.allData[this.currentIndex].children.map(
				(item) => {
					return {
						name: item.name,
						value: item.value,
						children: item.children, //增加第三类数据是为了在 tooltip 的 formatter函数的参数arg中拿到
					};
				}
			);
			//获取图例的数据
			const legendData = this.allData[this.currentIndex].children.map(
				(item) => {
					return item.name;
				}
			);
			const dataOption = {
				legend: {
					data: legendData,
				},
				series: [
					{
						data: seriesData,
					},
				],
			};
			this.chartInstance.setOption(dataOption);
		},
		screenAdapter() {
			this.titleFontSize = (this.$refs.hot_ref.offsetWidth / 100) * 3.6;
			const adapterOption = {
				title: {
					textStyle: {
						fontSize: this.titleFontSize,
					},
				},
				legend: {
					itemWidth: this.titleFontSize,
					itemHeight: this.titleFontSize,
					itemGap: this.titleFontSize / 2,
					textStyle: {
						fontSize: this.titleFontSize / 2,
					},
				},
				series: [
					{
						radius: this.titleFontSize * 4.5, //饼图的半径
						center: ["50%", "50%"],
					},
				],
			};
			this.chartInstance.setOption(adapterOption);
			this.chartInstance.resize();
		},
		toLeft() {
			this.currentIndex--;
			if (this.currentIndex < 0) {
				this.currentIndex = this.allData.length - 1;
			}
			this.updateChart();
		},
		toRight() {
			this.currentIndex++;
			if (this.currentIndex > this.allData.length - 1) {
				this.currentIndex = 0;
			}
			this.updateChart();
		},
	},
};
</script>
<style lang='less' scoped>
.arr-left {
	position: absolute;
	left: 10%;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
	color: white;
}
.arr-right {
	position: absolute;
	right: 10%;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
	color: white;
}
.cate-name {
	position: absolute;
	left: 80%;
	bottom: 20px;
	color: white;
}
</style>
