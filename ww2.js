const initialText = {
    "title": "II. Dünya Savaşı Çatışma Haritası",
    "description": "Bu harita, II. Dünya Savaşı süresince yaşanan önemli çatışmaları ve bu çatışmalar sırasında el değiştiren toprakları göstermektedir. II. Dünya Savaşı dünyanın birçok bölgesinde etki sahibi olmuş olduğundan dolayı bu haritayı fareniz ile gezebilirsiniz."
}

window.addEventListener('load', () => {
    const map = L.map('map', {
        maxBounds: [[], []],
        minZoom: 2.5,
        maxZoom: 6,
        maxBoundsViscosity: 1.0
    }).setView([0, 0], 0.5);

    let index = -1;
    let layer;
    let info;
    let timeline;
    let autoplay = false;

    let autoplayLoop;

    const title = document.getElementById('title');
    const description = document.getElementById('description');
    const simButtons = document.getElementById('simButtons');
    const okayButton = document.getElementById('okayButton');
    const backButton = document.getElementById('backButton');
    const nextButton = document.getElementById('nextButton');
    const autoplayButton = document.getElementById('autoplayButton');
    const progressBar = document.getElementById('progressBar');
    const counter = document.getElementById('counter');
    const descriptionButton = document.getElementById('descriptionButton');
    const backToMenuButton = document.getElementById('backToMenuButton');

    const initialZoom = 4;

    fetch('/data/countries.json')
        .then(response => response.json())
        .then(data => {
            info = data;
        });

    fetch('/data/timeline.json')
        .then(response => response.json())
        .then(data => {
            timeline = data;
            map.setView(timeline[0].zoom, initialZoom, { animate: false });
            
            title.innerHTML = initialText.title;
            description.innerText = initialText.description;
        });

    fetch('/data/geo0.geojson')
        .then(response => response.json())
        .then(data => {
            layer = new L.geoJSON(data, {
                style(feature) {
                    switch (feature.properties.side) {
                        case 'Neutral': return { color: "#7A7A7A" };
                        case 'Allied': return { color: "#2773F5" };
                        case 'Axis': return { color: "#F53527" };
                        case 'Capitalist': return { color: "#2773F5" };
                        case 'Communist': return { color: "#F53527" };
                        case 'Other': return { color: "#54AA54" };
                    }
                }
            }).on('click', function (e) {
                ShowCountry(e.layer.feature.properties.id);
            }).addTo(map)
        });

    nextButton.onclick = function () { Next(); }
    backButton.onclick = function () { Back(); }
    autoplayButton.onclick = function () { AutoPlay(); }
    descriptionButton.onclick = function () { ShowHideDescription(this); }
    backToMenuButton.onclick = function () { BackToMenu() };

    function BackToMenu() {
        if (index === -1) {
            title.innerHTML = initialText.title;
            description.innerText = initialText.description;
        } else {
            title.innerHTML = timeline[index].title;
            description.innerText = timeline[index].description;
        }

        okayButton.style.display = 'none';
        simButtons.style.display = 'block';
    }

    function ChangeTimeline() {
        map.setView(timeline[index].zoom, initialZoom, { animate: false });
        progressBar.value = index + 1;

        setTimeout(() => {
            fetch(`/data/geo${index}.geojson`)
                .then(response => response.json())
                .then(data => {
                    map.removeLayer(layer)
                    layer = new L.geoJSON(data, {
                        style(feature) {
                            switch (feature.properties.side) {
                                case 'Neutral': return { color: "#7A7A7A" };
                                case 'Allied': return { color: "#2773F5" };
                                case 'Axis': return { color: "#F53527" };
                                case 'Capitalist': return { color: "#2773F5" };
                                case 'Communist': return { color: "#F53527" };
                                case 'Other': return { color: "#54AA54" };
                            }
                        }
                    }).on('click', function (e) {
                        ShowCountry(e.layer.feature.properties.id);
                    }).addTo(map)
                });

            title.innerHTML = timeline[index].title;
            description.innerText = timeline[index].description;

            //setTimeout(() => {
            map.setView(timeline[index].zoom, initialZoom, { animate: false });
            setTimeout(() => {
                map.setView(timeline[index].zoom, initialZoom, { animate: false });
                map.setZoom(5, { animate: true });

                nextButton.removeAttribute('disabled');
                backButton.removeAttribute('disabled');
                if (index === timeline.length - 1) {
                    nextButton.innerText = 'Başa Dön';
                } else if (index === 0) {
                    nextButton.innerText = 'Sonraki';
                    backButton.setAttribute('disabled', 'true');
                } else {
                    nextButton.innerText = 'Sonraki';
                    backButton.removeAttribute('disabled');
                    nextButton.removeAttribute('disabled');
                }
            }, 1000);
            //}, 500);
        }, 1000);
    }

    function Back() {
        if (index <= 0) return false;
        index--

        counter.innerText = `${index + 1}/${timeline.length}`;

        nextButton.setAttribute('disabled', 'true');
        backButton.setAttribute('disabled', 'true');

        ChangeTimeline();
    }

    function Next() {
        if (index === timeline.length - 1) {
            index = 0;
        } else {
            index++;
        }

        if (index === 0) {
            progressBar.style.display = 'inline-block';
            counter.style.display = 'inline-block';
        }

        counter.innerText = `${index + 1}/${timeline.length}`;

        nextButton.setAttribute('disabled', 'true');
        backButton.setAttribute('disabled', 'true');

        ChangeTimeline();
    }

    function ShowCountry(id) {
        const country = info.find(c => c.id === id);
        if (!country) return false;

        title.innerText = country.name;
        description.innerText = country.description;

        simButtons.style.display = 'none';
        okayButton.style.display = 'block';
    }

    function ShowHideDescription(el) {
        if (description.style.display === 'none') {
            description.style.display = 'block';
            el.innerText = 'Açıklamayı gizle';
        } else {
            description.style.display = 'none';
            el.innerText = 'Açıklamayı göster';
        }
    }

    function AutoPlay() {
        if (autoplay === true) {
            autoplay = false;
            autoplayButton.innerText = 'Otomatik oynat'
            clearInterval(autoplayLoop);
        } else if (autoplay === false) {
            autoplay = true;
            autoplayButton.innerText = 'Otomatik oynatmayı durdur';
            Next();
            setTimeout(() => {
                if (autoplay === true) {
                    map.setView(timeline[index].zoom, initialZoom, { animate: false });
                    map.setZoom(1.5, { animate: true });
                }
            }, 5000);
            autoplayLoop = setInterval(() => {
                if (autoplay === true && index < timeline.length - 1) {
                    Next();
                    if (index === timeline.length - 1) {
                        autoplayButton.innerText = 'Otomatik oynat'
                        clearInterval(autoplayLoop);
                    }
                    setTimeout(() => {
                        if (autoplay === true) {
                            map.setView(timeline[index].zoom, initialZoom, { animate: false });
                            map.setZoom(1.5, { animate: true });
                        }
                    }, 5000);
                } else {
                    autoplayButton.innerText = 'Otomatik oynat'
                    clearInterval(autoplayLoop);
                }
            }, 10000);
        }
    }
});