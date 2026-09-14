// ============================================================
// Discrete-Time Convolution Demo
// app.js
// ============================================================


// ------------------------------------------------------------
// Discrete-time index
// k = -20, -19, ..., 20
// ------------------------------------------------------------

const k = Array.from(
    { length: 41 },
    (_, i) => i - 20
);


// Convolution output indices:
// (-20) + (-20) = -40
// 20 + 20 = 40
const yIndices = Array.from(
    { length: 81 },
    (_, i) => i - 40
);


// ------------------------------------------------------------
// Get controls from the HTML
// ------------------------------------------------------------

const xMenu = document.getElementById("xSignal");
const hMenu = document.getElementById("hSignal");

const slider = document.getElementById("nSlider");
const minusButton = document.getElementById("minus");
const plusButton = document.getElementById("plus");

const nValue = document.getElementById("nValue");
const equation = document.getElementById("equation");


// ------------------------------------------------------------
// Signal generator
// ------------------------------------------------------------

function signal(name) {

    switch (name) {

        case "Impulse":
            return k.map(i =>
                i === 0 ? 1 : 0
            );


        case "Step":
            return k.map(i =>
                i >= 0 && i <= 5 ? 1 : 0
            );


        case "Rectangle":
            return k.map(i =>
                Math.abs(i) <= 2 ? 1 : 0
            );


        case "Exponential":
            return k.map(i =>
                i >= 0 && i <= 10
                    ? Math.pow(0.7, i)
                    : 0
            );


        case "Sine":
            return k.map(i =>
                Math.abs(i) <= 5
                    ? Math.sin(0.7 * i)
                    : 0
            );


        default:
            return new Array(k.length).fill(0);
    }
}


// ------------------------------------------------------------
// Discrete convolution
// ------------------------------------------------------------

function convolve(x, h) {

    const y = new Array(
        x.length + h.length - 1
    ).fill(0);


    for (let i = 0; i < x.length; i++) {

        for (let j = 0; j < h.length; j++) {

            y[i + j] += x[i] * h[j];

        }

    }


    return y;
}


// ------------------------------------------------------------
// Evaluate h[n-k]
//
// h is stored for indices -20 ... 20.
//
// For every displayed k-value, we want:
//
//      h[n-k]
//
// ------------------------------------------------------------

function shiftedSignal(h, n) {

    return k.map(currentK => {

        const wantedIndex = n - currentK;

        // Since h[-20] is stored at array position 0:
        const arrayPosition = wantedIndex + 20;


        if (
            arrayPosition >= 0 &&
            arrayPosition < h.length
        ) {

            return h[arrayPosition];

        }


        return 0;
    });
}


// ------------------------------------------------------------
// Utility
// ------------------------------------------------------------

function maxAbs(values) {

    return Math.max(
        ...values.map(value => Math.abs(value))
    );
}


// ------------------------------------------------------------
// Build stem plot traces
//
// Plotly doesn't have MATLAB's stem() directly.
//
// We make:
//   1. vertical lines
//   2. markers
//
// Each vertical line is:
//
//      (k, 0)
//      (k, value)
//      null
//
// null separates it from the next stem.
// ------------------------------------------------------------

function makeStemTrace(
    indices,
    values,
    color,
    name
) {

    const lineX = [];
    const lineY = [];


    for (let i = 0; i < indices.length; i++) {

        lineX.push(
            indices[i],
            indices[i],
            null
        );

        lineY.push(
            0,
            values[i],
            null
        );
    }


    const stems = {

        x: lineX,
        y: lineY,

        type: "scatter",
        mode: "lines",

        line: {
            color: color,
            width: 2
        },

        hoverinfo: "skip",

        showlegend: false
    };


    const markers = {

        x: indices,
        y: values,

        type: "scatter",
        mode: "markers",

        name: name,

        marker: {
            color: color,
            size: 7
        },

        hovertemplate:
            "k = %{x}<br>" +
            "value = %{y:.3f}" +
            "<extra>" + name + "</extra>"
    };


    return [
        stems,
        markers
    ];
}


// ------------------------------------------------------------
// Plot configuration shared by all three plots
// ------------------------------------------------------------

const plotConfig = {

    responsive: true,

    displaylogo: false,

    modeBarButtonsToRemove: [
        "lasso2d",
        "select2d"
    ]
};


// ------------------------------------------------------------
// Main update function
// ------------------------------------------------------------

function update() {

    // --------------------------------------------------------
    // Read controls
    // --------------------------------------------------------

    const xName = xMenu.value;
    const hName = hMenu.value;

    const n = Number(slider.value);


    // Display n beside the slider
    nValue.textContent = `n = ${n}`;


    // --------------------------------------------------------
    // Generate signals
    // --------------------------------------------------------

    const x = signal(xName);
    const h = signal(hName);


    // Complete convolution
    const y = convolve(x, h);


    // Flipped + shifted h[n-k]
    const shiftedH = shiftedSignal(h, n);


    // Point-by-point multiplication
    const product = x.map(
        (value, i) => value * shiftedH[i]
    );


    // Current convolution value
    const currentY = product.reduce(
        (sum, value) => sum + value,
        0
    );


    // --------------------------------------------------------
    // Display equation
    // --------------------------------------------------------

    equation.innerHTML =
        `y[${n}] = Σ x[k]h[${n}−k] = ` +
        `<strong>${currentY.toFixed(3)}</strong>`;


    // --------------------------------------------------------
    // Fixed axis limits
    // --------------------------------------------------------

    const inputPeak = Math.max(
        maxAbs(x),
        maxAbs(h),
        0.1
    );


    const productPeak = Math.max(
        maxAbs(x) * maxAbs(h),
        0.1
    );


    const signalLimit =
        1.15 * Math.max(
            inputPeak,
            productPeak
        );


    const outputLimit =
        1.15 * Math.max(
            maxAbs(y),
            0.1
        );


    // ========================================================
    // 1. INPUT + SHIFTED h[n-k]
    // ========================================================

    const xStem = makeStemTrace(
        k,
        x,
        "#2563eb",
        "x[k]"
    );


    const hStem = makeStemTrace(
        k,
        shiftedH,
        "#ea580c",
        `h[${n}-k]`
    );


    const overlapData = [
        ...xStem,
        ...hStem
    ];


    const overlapLayout = {

        title: {
            text:
                `x[k] and flipped/shifted h[${n}−k]`,
            font: {
                size: 18
            }
        },

        margin: {
            l: 55,
            r: 25,
            t: 55,
            b: 50
        },

        xaxis: {

            title: "Discrete-time index",

            range: [-20.5, 20.5],

            tickmode: "linear",
            tick0: -20,
            dtick: 5,

            zeroline: true,
            zerolinecolor: "#000",
            zerolinewidth: 1,

            gridcolor: "#e2e8f0"
        },

        yaxis: {

            range: [
                -signalLimit,
                signalLimit
            ],

            zeroline: true,
            zerolinecolor: "#000",
            zerolinewidth: 1,

            gridcolor: "#e2e8f0"
        },

        legend: {

            orientation: "h",

            x: 0.5,
            xanchor: "center",

            y: 1.08,
            yanchor: "bottom"
        },

        hovermode: "closest",

        paper_bgcolor: "white",
        plot_bgcolor: "white",

        uirevision: "overlap"
    };


    Plotly.react(
        "overlapPlot",
        overlapData,
        overlapLayout,
        plotConfig
    );


    // ========================================================
    // 2. PRODUCT x[k] h[n-k]
    // ========================================================

    const productStem = makeStemTrace(
        k,
        product,
        "#7c3aed",
        "Product"
    );


    const productLayout = {

        title: {
            text:
                `x[k]h[${n}−k] — sum = ${currentY.toFixed(3)}`,
            font: {
                size: 17
            }
        },

        margin: {
            l: 55,
            r: 20,
            t: 55,
            b: 50
        },

        xaxis: {

            title: "Discrete-time index",

            range: [-20.5, 20.5],

            tickmode: "linear",
            tick0: -20,
            dtick: 5,

            zeroline: true,
            zerolinecolor: "#000",
            zerolinewidth: 1,

            gridcolor: "#e2e8f0"
        },

        yaxis: {

            range: [
                -signalLimit,
                signalLimit
            ],

            zeroline: true,
            zerolinecolor: "#000",
            zerolinewidth: 1,

            gridcolor: "#e2e8f0"
        },

        showlegend: false,

        hovermode: "closest",

        paper_bgcolor: "white",
        plot_bgcolor: "white",

        uirevision: "product"
    };


    Plotly.react(
        "productPlot",
        productStem,
        productLayout,
        plotConfig
    );


    // ========================================================
    // 3. COMPLETE CONVOLUTION OUTPUT
    // ========================================================

    const outputStem = makeStemTrace(
        yIndices,
        y,
        "#059669",
        "y[n]"
    );


    // Position inside y[]
    //
    // y[-40] -> y[0]
    // y[0]   -> y[40]
    //
    const currentOutputIndex = n + 40;

    const highlightedY =
        y[currentOutputIndex];


    // Red highlighted current sample
    const currentPoint = {

        x: [n],

        y: [highlightedY],

        type: "scatter",

        mode: "markers",

        marker: {

            color: "#dc2626",

            size: 12,

            line: {
                color: "white",
                width: 2
            }
        },

        name: `y[${n}]`,

        hovertemplate:
            `n = ${n}<br>` +
            `y[n] = ${highlightedY.toFixed(3)}` +
            "<extra></extra>"
    };


    const outputData = [
        ...outputStem,
        currentPoint
    ];


    const outputLayout = {

        title: {
            text: "Complete convolution y[n]",
            font: {
                size: 17
            }
        },

        margin: {
            l: 55,
            r: 20,
            t: 55,
            b: 50
        },

        xaxis: {

            title: "Discrete-time index",

            range: [-40.5, 40.5],

            tickmode: "linear",
            tick0: -40,
            dtick: 10,

            zeroline: true,
            zerolinecolor: "#000",
            zerolinewidth: 1,

            gridcolor: "#e2e8f0"
        },

        yaxis: {

            range: [
                -outputLimit,
                outputLimit
            ],

            zeroline: true,
            zerolinecolor: "#000",
            zerolinewidth: 1,

            gridcolor: "#e2e8f0"
        },

        shapes: [

            // Red vertical line marking current n
            {
                type: "line",

                x0: n,
                x1: n,

                y0: -outputLimit,
                y1: outputLimit,

                line: {
                    color: "#dc2626",
                    width: 2,
                    dash: "dash"
                }
            }
        ],

        showlegend: false,

        hovermode: "closest",

        paper_bgcolor: "white",
        plot_bgcolor: "white",

        uirevision: "output"
    };


    Plotly.react(
        "outputPlot",
        outputData,
        outputLayout,
        plotConfig
    );
}


// ============================================================
// Controls
// ============================================================


// ------------------------------------------------------------
// Slider
// ------------------------------------------------------------

slider.addEventListener(
    "input",
    update
);


// ------------------------------------------------------------
// Signal dropdowns
// ------------------------------------------------------------

xMenu.addEventListener(
    "change",
    update
);


hMenu.addEventListener(
    "change",
    update
);


// ------------------------------------------------------------
// Minus button
// ------------------------------------------------------------

minusButton.addEventListener(
    "click",
    () => {

        const minimum =
            Number(slider.min);

        const current =
            Number(slider.value);


        slider.value =
            Math.max(
                minimum,
                current - 1
            );


        update();
    }
);


// ------------------------------------------------------------
// Plus button
// ------------------------------------------------------------

plusButton.addEventListener(
    "click",
    () => {

        const maximum =
            Number(slider.max);

        const current =
            Number(slider.value);


        slider.value =
            Math.min(
                maximum,
                current + 1
            );


        update();
    }
);


// ============================================================
// Keyboard controls
//
// Left arrow  -> n - 1
// Right arrow -> n + 1
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        // Don't interfere if user is interacting
        // with a dropdown.
        if (
            document.activeElement.tagName === "SELECT"
        ) {
            return;
        }


        if (event.key === "ArrowLeft") {

            const minimum =
                Number(slider.min);

            slider.value =
                Math.max(
                    minimum,
                    Number(slider.value) - 1
                );

            update();
        }


        if (event.key === "ArrowRight") {

            const maximum =
                Number(slider.max);

            slider.value =
                Math.min(
                    maximum,
                    Number(slider.value) + 1
                );

            update();
        }

    }
);


// ============================================================
// Initial render
// ============================================================

update();
