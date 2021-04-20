// Основные параметры:
// - ширина диграммы; 
const width = 1000;

// - ширина столбца;
const barWidth = 500;

// - высота диаграммы;
const height = 500;

// - параметра для координат (margin).
const margin = 30;

// Год в пузрьчатой диаграмме.
const yearLable = d3.select('#year');

// Название страны в линейной диаграмме.
const countryName = d3.select('#country-name');

// Столбчатая диаграмма.
const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

// Пузырьчатая диаграмма.
const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

// Линейная диаграмма.
const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

// Задание начальных параметров.
let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

// Значения координат пузырчатой и линейной диаграмм.
const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

// Значения координат столбчатой диаграммы.
const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

// Значения осей пузырчатой диаграммы.
const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

// Значения осей линейной диаграммы.
const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

// Значения осей столбчатой диаграммы.
const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

// Значения цветов.
const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);

// Значения радиусов пузырьков.
const radiusScale = d3.scaleSqrt().range([10, 30]);

// После загрузки данных:
loadData().then(data => {
    console.log();
    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    // Настройка обратботчиков.

    // - реакция на изменение временного ползунка;
    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    // - реакция на изменение значения параметра;
    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    // - реакция на изменение параметра оси абсцисс;
    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    // - реакция на изменение параметра оси ординат;
    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScattePlot();
    });

    // - реакция на изменение параметра отбора столбчатой диаграммы.
    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    // - реакция на изменение параметра линейной диаграммы.
    d3.select('#p').on('change', function(){ 
        lineParam = d3.select(this).property('value');
        updateLinearPlot();
    });

    // Функция для обновления столбчатой диаграммы.
    function updateBar(){
        // Вовзращение уникальных значений регионов.
        regions = d3.map(data, function (d) {
            return d['region'];
        }).keys();

        // Нахождение средних значений.
        mean = regions.map(
            baseRegion => (
                d3.mean(
                    data.filter(d => d['region'] == baseRegion)
                        .flatMap(d => d[param][year])
                )
            )
        );
        
        // Совмещение регионов и средних значений.
        mean_for_region = [];
        regions.forEach((key, i) => {
            let nobj = {"region": key, "mean": mean[i]};
            mean_for_region.push(nobj);
        });

        // Шкала на оси абсцисс.
        xBar.domain(regions);
        xBarAxis.call(d3.axisBottom(xBar));

        // Шкала на оси ординат.
        yBar.domain([0, d3.max(mean)]).range([height, 0]);
        yBarAxis.call(d3.axisLeft(yBar));

        // Добавление и обновление столбцов.
        barChart.selectAll('rect').data(mean_for_region).enter().append('rect')
            .attr('width', xBar.bandwidth())
            .attr('height', d => height - yBar(d['mean']))
            .attr('x', d => xBar(d['region']))
            .attr('y', d => yBar(d['mean']) - 30)
            .style("fill", d => colorScale(d['region']));

        barChart.selectAll('rect').data(mean_for_region)
            .attr('width', xBar.bandwidth())
            .attr('height', d => height - yBar(d['mean']))
            .attr('x', d => xBar(d['region']))
            .attr('y', d => yBar(d['mean']) - 30)
            .style("fill", d => colorScale(d['region']));

        // Реакция на клик на столбец.
        d3.selectAll('rect').on('click', function (actual, i) {
            // Изменение прозрачностей столбцов.
            d3.selectAll('rect').style('opacity', 0.5);
            d3.select(this).style('opacity', 1);
            
            // Изменение прозрачностей пузырьков.
            d3.selectAll('circle').style('opacity', 0);
            d3.selectAll('circle').filter(d => d['region'] == actual.region).style('opacity', 1);
        });

        // Для отмены разбиения.
        d3.selectAll('#meladze').on('click', function (actual, i) {
              d3.selectAll('rect').style('opacity', 1);
              d3.selectAll('circle').style('opacity', 0.7);
        });

        return;
    }

    // Функция для обновления пузырьковой диаграммы.
    function updateScattePlot(){
        // Получение текстового описания года.
        d3.select('.year').text(year);

        // Шкала на оси абсцисс.
        let xRange = data.map(d=> +d[xParam][year]);
        x.domain([d3.min(xRange), d3.max(xRange)]);
        xAxis.call(d3.axisBottom(x));
        
        // Шкала на оси ординат.
        let yRange = data.map(d => +d[yParam][year]);
        y.domain([d3.min(yRange), d3.max(yRange)]);
        yAxis.call(d3.axisLeft(y));

        // Значение радиуса.
        let rRange = data.map(d => +d[rParam][year]);
        radiusScale.domain([d3.min(rRange), d3.max(rRange)]);
        
        // Добавление и обновление пузырьков.
        scatterPlot.selectAll('circle').data(data)
            .enter()
                .append('circle')
                    .attr("cx", d => x(d[xParam][year]))
                    .attr("cy", d => y(d[yParam][year]))
                    .attr("r", d => radiusScale(d[rParam][year]))
                    .style("fill", d => colorScale(d['region']))
                    .style("opacity", 0.75);

        scatterPlot.selectAll('circle').data(data)
            .attr("cx", d => x(d[xParam][year]))
            .attr("cy", d => y(d[yParam][year]))
            .attr("r", d => radiusScale(d[rParam][year]))
            .style("fill", d => colorScale(d['region']))
            .style("opacity", 0.75);

        return;
    }
    
    // Функция для обновления линейной диаграммы.
    function updateLinearPlot(){
        // Проверка выбора пузырька.
        if (selected) {
            // Выбор параметра "Навзание страны" у пузырька, на который кликнули.
            d3.select('.country-name').text(selected);

            // Поиск данных по выбранной стране и параметру.
            let country_data = data.filter(d => d['country'] == selected).map(d => d[lineParam])[0];

            // Создание словаря из года и значения выбранного параметра.
            let dict_data = [];
            for (let i = 1800; i < 2021; i++)
                dict_data.push({"year": i, "value": parseFloat(country_data[i])})

            dict_data.splice(221, 5);

            // Шкала на оси абсцисс.
            let xRange = d3.range(1800, 2021);
            x.domain([d3.min(xRange), d3.max(xRange)]);
            xLineAxis.call(d3.axisBottom(x));

            // Шкала на оси ординат.
            let yRange = d3.values(country_data).map(d => +d);
            y.domain([d3.min(yRange), d3.max(yRange)]);
            yLineAxis.call(d3.axisLeft(y));
            
            // Добавление и обновление линейной диаграммы.
            lineChart.append('path').attr('class', 'line').datum(dict_data)
                .enter()
                    .append('path');

            lineChart.selectAll('.line').datum(dict_data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.value))
                );
        }   
        
        return;
    }

    // Первоначальный вызов функций обновлений диаграмм.
    updateBar();
    updateScattePlot();
    updateLinearPlot();

    // Реакция на клик на пузырек.
    scatterPlot.selectAll('circle').on('click', function (actual, i) {
        // Получение страны от выбранного пузырька.
        selected = actual['country'];

        // Отмена выделений.
        d3.selectAll('circle').attr('stroke-width', 'default');
        
        // Выделение выбранного пузырька.
        this.parentNode.appendChild(this);
        d3.select(this).attr('stroke-width', 5);

        // Обновление линейной диаграммы.
        updateLinearPlot();

        return;
    });
});

// Функция для загрузки данных.
async function loadData() {
    // Загрузка данных в словарь.
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    // Сопоставление различных наборов данных.
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}