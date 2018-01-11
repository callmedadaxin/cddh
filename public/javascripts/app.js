const baseUrl = 'https://www.baidu.com/s?wd=';

$(() => {
    new Vue({
        el: '#app',
        data: {
            iframe: 'https://www.baidu.com',

            state: false,
            startBtnText: '点击开始',
            startTip: '',

            question: {
                title: '',
                options: ['', '', '']
            }
        },
        methods: {
            start() {
                if (this.state) {
                    clearInterval(window.timer);
                    this.startBtnText = '点击开始'
                    this.startTip = ''
                } else {
                    this.startBtnText = '正在查询问题..';
                    this.startTip = '正在等待问题...';
                    window.timer = setInterval(() => {
                        this.query()
                    }, 1000)
                }
                this.state = !this.state;
            },

            query() {
                $.get('/query', (res) => {
                    if (res.code === 0) {
                        var options = JSON.parse(res.options).map(item => {
                            return item.trim()
                        });
                        this.question.title = res.desc;
                        this.question.options = options;
                        this.iframe = `${baseUrl}${res.desc} ${options[0]} ${options[1]} ${options[2]}`

                        this.startTip = '问题已经进行搜索！';
                        this.statistics(res.desc, res.options);
                    } else {
                        this.startTip = '正在等待问题...';
                    }
                });
            },

            statistics(question, options) {
                $.post('/stat', {
                    question: question,
                    options: options
                }, (res) => {
                    if (res.code === 0) {
                        randerSogouChart(res.data.sogou);
                        randerQh360Chart(res.data.qh360);
                    }
                })
            }
        }
    });

    var sgChart = echarts.init(document.getElementById('sogou-chart'));
    var qhChart = echarts.init(document.getElementById('qh360-chart'));
    var randerSogouChart = function (data) {
        var option = {
            title: {
                text: '搜狗搜索条目',
                textStyle: {
                    color: '#F94D1B'
                }
            },
            color: ['#3398DB'],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [{
                type: 'category',
                data: data.map(d => d.option),
                axisTick: {
                    alignWithLabel: true
                },
                axisLabel: {
                    rotate: 45
                }
            }],
            yAxis: [{
                type: 'value'
            }],
            series: [{
                name: '直接访问',
                type: 'bar',
                barWidth: '60%',
                data: data.map(d => d.num)
            }]
        };
        sgChart.setOption(option);
    }

    var randerQh360Chart = function (data) {
        var option = {
            title: {
                text: '360搜索条目',
                textStyle: {
                    color: '#28B859'
                }
            },
            color: ['#3398DB'],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [{
                type: 'category',
                data: data.map(d => d.option),
                axisTick: {
                    alignWithLabel: true
                },
                axisLabel: {
                    rotate: 45
                }
            }],
            yAxis: [{
                type: 'value'
            }],
            series: [{
                name: '直接访问',
                type: 'bar',
                barWidth: '60%',
                data: data.map(d => d.num),
            }]
        };
        qhChart.setOption(option);
    }
});