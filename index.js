import nameToCca3 from '/hh-school-typescript-1/nametocca3.js';
import Maps from '/hh-school-typescript-1/maps.js';
// Загрузка данных через await
async function getData(url) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    });
    // При сетевой ошибке (мы оффлайн) из `fetch` вылетит эксцепшн.
    // Тут мы даём ему просто вылететь из функции дальше наверх.
    // Если же его нужно обработать, придётся обернуть в `try` и сам `fetch`:
    //
    // try {
    //     response = await fetch(url, {...});
    // } catch (error) {
    //     // Что-то делаем
    //     throw error;
    // }
    // Если мы тут, значит, запрос выполнился.
    // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
    if (response.ok) {
        return response.json();
    }
    // Пример кастомной ошибки (если нужно проставить какие-то поля
    // для внешнего кода). Можно выкинуть и сам `response`, смотря
    // какой у вас контракт. Главное перевести код в ветку `catch`.
    const error = {
        status: response.status,
        customError: 'wtfAsync',
    };
    throw error;
}
async function loadCountriesData() {
    let countries = [];
    try {
        // ПРОВЕРКА ОШИБКИ №1: ломаем этот урл, заменяя all на allolo,
        // получаем кастомную ошибку.
        countries = await getData('https://restcountries.com/v3.1/all?fields=cca3&fields=name&fields=borders');
    }
    catch (error) {
        // console.log('catch for getData');
        // console.error(error);
        throw error;
    }
    return countries.reduce((result, country) => {
        result[country.cca3] = country;
        return result;
    }, {});
}
const form = document.getElementById('form');
const fromCountry = document.getElementById('fromCountry');
const toCountry = document.getElementById('toCountry');
const countriesList = document.getElementById('countriesList');
const submit = document.getElementById('submit');
const output = document.getElementById('output');
const disableInputs = () => {
    fromCountry.disabled = true;
    toCountry.disabled = true;
    submit.disabled = true;
};
const enableInputs = () => {
    fromCountry.disabled = false;
    toCountry.disabled = false;
    submit.disabled = false;
};
const showMessage = (message, enable = true) => {
    output.textContent = message;
    if (enable) {
        enableInputs();
    }
};
(async () => {
    disableInputs();
    showMessage('Loading…', false);
    let countriesData = {};
    try {
        // ПРОВЕРКА ОШИБКИ №2: Ставим тут брейкпоинт и, когда дойдёт
        // до него, переходим в оффлайн-режим. Получаем эксцепшн из `fetch`.
        countriesData = await loadCountriesData();
    }
    catch (error) {
        // console.log('catch for loadCountriesData');
        // console.error(error);
        output.textContent = 'Something went wrong. Try to reset your compluter.';
        return;
    }
    output.textContent = '';
    const getBorders = (cca3) => countriesData[cca3]?.borders;
    // Заполняем список стран для подсказки в инпутах
    Object.keys(countriesData)
        .sort((a, b) => countriesData[a].name.common.localeCompare(countriesData[b].name.common))
        .forEach((code) => {
        const option = document.createElement('option');
        option.value = countriesData[code].name.common;
        countriesList.appendChild(option);
    });
    enableInputs();
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        disableInputs();
        output.textContent = 'Loading, please wait';
        const from = nameToCca3[fromCountry.value];
        const to = nameToCca3[toCountry.value];
        if (!from || !to) {
            return showMessage('Incorrect country names, please check and try again');
        }
        if (from === to) {
            return showMessage('You have chosen the same country');
        }
        if (!getBorders(from).length) {
            return showMessage('The country of departure has no land borders');
        }
        if (!getBorders(to).length) {
            return showMessage('The country of arrival has no land borders');
        }
        Maps.setEndPoints(from, to);
        const queue = [{ cca3: from, route: [from], distance: 0 }];
        const visited = {};
        let i = 0;
        while (queue.length > 0) {
            const current = queue.shift();
            visited[current.cca3] = 1;
            console.log('current cca3', current.cca3);
            console.log('current route', current.route);
            console.log('current distance', current.distance);
            console.log('queue', queue);
            console.log('visited', visited);
            console.log('-----');
            const borders = getBorders(current.cca3);
            const distance = current.distance + 1;
            if (distance <= 20) {
                borders.forEach((country) => {
                    if (!visited[country] && !queue.find((item) => item.cca3 === country)) {
                        queue.push({
                            cca3: country,
                            route: [...current.route, country],
                            distance,
                        });
                    }
                });
            }
            i += 1;
            if (current.cca3 === to) {
                Maps.markAsVisited(current.route);
                return showMessage(`Route: ${current.route.join(' → ')}; Distance: ${current.distance}; BFS Iterations: ${i}; API Requests: 1`);
            }
        }
        return showMessage('These countries are too far apart');
    });
})();
