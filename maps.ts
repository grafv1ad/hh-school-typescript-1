/* global am5, am5map, am5geodata_worldLow, am5themes_Animated */

import * as am5 from './node_modules/@amcharts/amcharts5/index.ts';
import * as am5map from './node_modules/@amcharts/amcharts5/map.ts';
import am5geodata_worldLow from './node_modules/@amcharts/amcharts5-geodata/worldLow.ts';
import am5themes_Animated from './node_modules/@amcharts/amcharts5/themes/Animated.ts';
import cca3to2Map from './cca3to2.ts';

const empty = (): void => {
    console.error('am5 is not initialized yet');
};

interface IModule {
    setEndPoints(from: string, to: string): void,
    markAsVisited(countryCodes: Array<string>): void,
}

const module: IModule = {
    setEndPoints: (from: string, to: string): void => {
        empty();
    },
    markAsVisited: (countryCodes: Array<string>): void => {
        empty();
    }
};

// См. https://www.amcharts.com/demos/map-timeline/
am5.ready((): void => {
    // Вообще так делать нехорошо. Куда поставить div, какая у него высота
    // и всё такое прочее должно решать приложение, а не модуль карты.
    const mapNode = document.createElement('div') as HTMLDivElement;
    const output = document.querySelector('#output') as HTMLDivElement;
    mapNode.id = 'maps';
    mapNode.style.height = '500px';
    mapNode.style.marginTop = '20px';
    output.parentNode!.appendChild(mapNode);

    const root = am5.Root.new('maps');

    // eslint-disable-next-line camelcase
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5map.MapChart.new(root, {
            projection: am5map.geoNaturalEarth1(),
        })
    );

    chart.set(
        'zoomControl',
        am5map.ZoomControl.new(root, {
            x: am5.p0,
            centerX: am5.p0,
            y: am5.p0,
            centerY: am5.p0,
        })
    );

    const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
            // eslint-disable-next-line camelcase
            geoJSON: am5geodata_worldLow,
            exclude: ['AQ'],
            fill: root.interfaceColors.get('stroke'),
        })
    );

    polygonSeries.mapPolygons.template.setAll({
        tooltipText: '{name}',
        interactive: true,
    });

    chart.appear(1000, 100);

    // ХЗ как в API am5 сбросить все закрашенные полигоны, так что храним их тут
    interface IMarkedDataItems {
        [key: string]: boolean,
    }

    let markedDataItems: IMarkedDataItems = {};
    const resetAllMarks = () => {
        Object.keys(markedDataItems).forEach((mapCode) => {
            const dataItem = polygonSeries.getDataItemById(mapCode)!;
            dataItem.get('mapPolygon').remove('fill');
        });
        markedDataItems = {};
    };

    const fill = (countryCodes: Array<string>, colorName: string): void => {
        countryCodes.forEach((cca3: string) => {
            const mapCode: string = cca3to2Map[cca3];
            if (markedDataItems[mapCode]) {
                return;
            }
            const dataItem = polygonSeries.getDataItemById(mapCode);
            if (dataItem) {
                markedDataItems[mapCode] = true;
                // @ts-expect-error Получал следующую ошибку: Argument of type 'string' is not assignable to parameter of type 'keyof IInterfaceColorsSettings'
                // Исходники смотрел, не смог разобраться в чем беда :(
                dataItem.get('mapPolygon').set('fill', root.interfaceColors.get(colorName));
            }
        });
    };

    module.setEndPoints = (from: string, to: string): void => {
        resetAllMarks();
        fill([from, to], 'primaryButtonHover');
    };

    module.markAsVisited = (countryCodes: Array<string>): void => {
        fill(countryCodes, 'positive');
    };
});

export default module;
