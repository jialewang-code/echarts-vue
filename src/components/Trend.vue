<template>
	<div class="com-container">
		<div class="title" :style="comStyle">
			<span>{{ "⎮ " + showTitle }}</span>
			<span
				class="iconfont title-icon"
				:style="comStyle"
				@click="showChoice = !showChoice"
				>&#xe6eb;</span
			>
			<div class="select-con" v-show="showChoice" :style="marginStyle">
				<div
					class="select-item"
					v-for="item in selectTypes"
					:key="item.key"
					@click="handleSelect(item.key)"
				>
					{{ item.text }}
				</div>
			</div>
		</div>

		<div class="com-chart" ref="trend_ref"></div>
	</div>
</template>

<script>
import { mapState } from "vuex";
import { getThemeValue } from "@/utils/theme_utils";

export default {
	name: "Trend",
	data() {
		return {
			chartInstance: null,
			allData: null, //从服务器中获取的所有数据
			showChoice: false, //是否显示可选项
			choiceType: "map", //显示标题类型
			titleFontSize: 0, // 指明标题的字体大小
		};
	},
	created() {
		//在组件创建完成后，进行回调函数的注册
		this.$socket.registerCallback("trendData", this.getData);
	},
	mounted() {
		this.initChart();
		// this.getData();
		//发送数据给服务器，告诉服务器，我现在需要数据
		this.$socket.send({
			action: "getData",
			socketType: "trendData",
			chartName: "trend",
			value: "",
		});
		window.addEventListener("resize", this.screenAdapter);
		this.screenAdapter();
	},
	destroyed() {
		window.removeEventListener("resize", this.screenAdapter);
		//在组件销毁的时候，进行回调函数的取消
		this.$socket.unRegisterCallback("trendData");
	},
	computed: {
		//计算出显示标题组
		selectTypes() {
			if (!this.allData) {
				return [];
			} else {
				return this.allData.type.filter((item) => {
					return item.key !== this.choiceType;
				});
			}
		},
		//计算出标题
		showTitle() {
			if (!this.allData) {
				return "";
			} else {
				return this.allData[this.choiceType].title;
			}
		},
		// 设置给标题的样式
		comStyle() {
			return {
				fontSize: this.titleFontSize + "px",
				color: getThemeValue(this.theme).titleColor,
			};
		},
		marginStyle() {
			return {
				marginLeft: this.titleFontSize + "px",
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
			this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme);
			const initOption = {
				xAxis: {
					type: "category",
					boundaryGap: false, //紧挨边缘
				},
				yAxis: {
					type: "value",
				},
				tooltip: {
					trigger: "axis", //显示提示框
				},
				grid: {
					left: "3%",
					top: "35%",
					right: "4%",
					bottom: "1%",
					containLabel: true, //显示出坐标轴上文字设置
				},
				legend: {
					top: "15%",
					left: 20,
					icon: "circle",
				},
			};
			this.chartInstance.setOption(initOption);
		},
		// ret 就是服务端发送给客户端的图表数据
		getData(ret) {
			// const { data: ret } = await this.$http.get("trend");
			// console.log(ret);
			this.allData = ret;
			this.updateChart();
		},
		updateChart() {
			// 半透明的颜色值
			const colorArr1 = [
				"rgba(11, 168, 44, 0.5)",
				"rgba(44, 110, 255, 0.5)",
				"rgba(22, 242, 217, 0.5)",
				"rgba(254, 33, 30, 0.5)",
				"rgba(250, 105, 0, 0.5)",
			];
			// 全透明的颜色值
			const colorArr2 = [
				"rgba(11, 168, 44, 0)",
				"rgba(44, 110, 255, 0)",
				"rgba(22, 242, 217, 0)",
				"rgba(254, 33, 30, 0)",
				"rgba(250, 105, 0, 0)",
			];
			//处理获取数据
			//类目轴的数据
			const timeArr = this.allData.common.month;
			//y轴的数据，series下的数据
			const valueArr = this.allData[this.choiceType].data;
			const seriesArr = valueArr.map((item, index) => {
				return {
					name: item.name,
					type: "line",
					data: item.data,
					stack: this.choiceType, //堆叠图
					areaStyle: {
						color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{
								offset: 0,
								color: colorArr1[index],
							},
							{
								offset: 1,
								color: colorArr2[index],
							},
						]),
					},
				};
			});
			//图例的数据
			const legendArr = valueArr.map((item) => {
				return item.name;
			});
			const dataOption = {
				xAxis: {
					data: timeArr,
				},
				legend: {
					data: legendArr,
				},
				series: seriesArr, //[{},{},{}]
			};
			this.chartInstance.setOption(dataOption);
		},
		screenAdapter() {
			this.titleFontSize = (this.$refs.trend_ref.offsetWidth / 100) * 3.6;
			const adapterOption = {
				legend: {
					itemWidth: this.titleFontSize,
					itemHight: this.titleFontSize,
					itemGap: this.titleFontSize,
					textStyle: {
						fontSize: this.titleFontSize / 2,
					},
				},
			};
			this.chartInstance.setOption(adapterOption);
			this.chartInstance.resize();
		},
		handleSelect(currentType) {
			this.choiceType = currentType;
			this.updateChart();
			this.showChoice = false;
		},
	},
};
</script>
<style lang='less' scoped>
.title {
	position: absolute;
	left: 20px;
	top: 20px;
	z-index: 10;
	color: white;
	.title-icon {
		margin-left: 10px;
		cursor: pointer;
	}
	.select-con {
		background-color: #222733;
	}
}
</style>
