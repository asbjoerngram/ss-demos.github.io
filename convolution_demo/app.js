// ============================================================
// Discrete-Time Convolution Demo
// Fast version: create plots once, then update existing traces.
// ============================================================


// ============================================================
// Indices
// ============================================================

const k = Array.from(
    { length: 41 },
    (_, i) => i - 20
);

const yIndices = Array.from(
    { length: 81 },
    (_, i) => i - 40
);


// ============================================================
// DOM elements
// ============================================================

const xMenu = document.getElementById("xSignal");
const hMenu = document.getElementById("hSignal");

const slider = document.getElementById("nSlider");
const minusButton = document.getElementById("minus");
const plusButton = document.getElementById("plus");

const nValue = document.getElementById("nValue");
const equation = document.getElementById("equation");

const overlapPlot = document.getElementById("overlapPlot");
const productPlot = document.getElementById("productPlot");
const outputPlot = document.getElementById("outputPlot");


// ============================================================
// Colors
// ============================================================

const BLUE = "#2563eb";
const ORANGE = "#ea580c";
const PURPLE = "#7c3aed";
const GREEN = "#059669";
const RED = "#dc2626";


// ============================================================
// Signal generator
// ============================================================

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


// ============================================================
// Convolution
// ============================================================

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


// ============================================================
// Compute h[n-k]
// ============================================================

function shiftedSignal(h, n) {

    return k.map(currentK => {

        const wantedIndex = n - currentK;

        // h[-20] is stored at position 0
        const position = wantedIndex + 20;


        if (
            position >= 0 &&
            position < h.length
        ) {

            return h[position];

        }


        return 0;
    });
}


// ============================================================
// Helpers
// ============================================================

function maxAbs(values) {

    return Math.max(
        ...values.map(value => Math.abs(value))
    );
}


// ------------------------------------------------------------
// x-coordinates used for vertical stem lines
//
// Example:
//
//   [-20, -20, null,
//    -19, -19, null,
//    ...]
// ------------------------------------------------------------

function stemLineX(indices) {

    const result = [];


    for (const index of indices) {

        result.push(
            index,
            index,
            null
        );
    }


    return result;
}


// ------------------------------------------------------------
// y-coordinates used for vertical stem lines
//
// Example:
//
//   [0, value, null,
//    0, value, null,
//    ...]
// ------------------------------------------------------------

function stemLineY(values) {

    const result = [];


    for (const value of values) {

        result.push(
            0,
            value,
            null
        );
    }


    return result;
}


// ============================================================
// Create initial stem traces
// ============================================================

function makeStemTraces(
    indices,
    values,
    color,
    name
) {

    const stems = {

        x: stemLineX(indices),

        y: stemLineY(values),

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
            "index = %{x}<br>" +
            "value = %{y:.3f}" +
            "<extra>" + name + "</extra>"
    };


    return [
        stems,
        markers
    ];
}


// ============================================================
// Plot configuration
// ============================================================

const plotConfig = {

    responsive: true,

    displaylogo: false,

    scrollZoom: false,

    modeBarButtonsToRemove: [
        "lasso2d",
        "select2d"
    ]
};


// ============================================================
// Application state
// ============================================================

let x;
let h;
let y;

let shiftedH;
let product;
let currentY;

let signalLimit;
let outputLimit;

let plotsReady = false;


// ============================================================
// Recalculate signals
// ============================================================

function calculateSignals() {

    x = signal(xMenu.value);
    h = signal(hMenu.value);

    y = convolve(x, h);


    const inputPeak = Math.max(
        maxAbs(x),
        maxAbs(h),
        0.1
    );


    const productPeak = Math.max(
        maxAbs(x) * maxAbs(h),
        0.1
    );


    signalLimit =
        1.15 * Math.max(
            inputPeak,
            productPeak
        );


    outputLimit =
        1.15 * Math.max(
            maxAbs(y),
            0.1
        );
}


// ============================================================
// Recalculate only things that depend on n
// ============================================================

function calculateShift() {

    const n = Number(slider.value);


    shiftedH = shiftedSignal(
        h,
        n
    );


    product = x.map(
        (value, i) =>
            value * shiftedH[i]
    );


    currentY = product.reduce(
        (sum, value) =>
            sum + value,
        0
    );
}


// ============================================================
// Text
// ============================================================

function updateText() {

    const n = Number(slider.value);


    nValue.textContent =
        `n = ${n}`;


    equation.innerHTML =
        `y[${n}] = Σ x[k]h[${n}−k] = ` +
        `<strong>${currentY.toFixed(3)}</strong>`;
}


// ============================================================
// INITIAL PLOT CREATION
//
// This happens only ONCE.
// ============================================================

async function createPlots() {

    calculateSignals();
    calculateShift();
    updateText();


    const n = Number(slider.value);


    // ========================================================
    // TOP PLOT
    // ========================================================

    const xTraces = makeStemTraces(
        k,
        x,
        BLUE,
        "x[k]"
    );


    const hTraces = makeStemTraces(
        k,
        shiftedH,
        ORANGE,
        "h[n-k]"
    );


    await Plotly.newPlot(

        overlapPlot,

        [
            ...xTraces,
            ...hTraces
        ],

        {

            title: {
                text:
                    `x[k] and flipped/shifted h[${n}−k]`
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

            paper_bgcolor: "white",
            plot_bgcolor: "white"
        },

        plotConfig
    );


    // ========================================================
    // PRODUCT PLOT
    // ========================================================

    const productTraces = makeStemTraces(
        k,
        product,
        PURPLE,
        "Product"
    );


    await Plotly.newPlot(

        productPlot,

        productTraces,

        {

            title: {
                text:
                    `x[k]h[${n}−k] — sum = ${currentY.toFixed(3)}`
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

            paper_bgcolor: "white",
            plot_bgcolor: "white"
        },

        plotConfig
    );


    // ========================================================
    // OUTPUT PLOT
    // ========================================================

    const outputTraces = makeStemTraces(
        yIndices,
        y,
        GREEN,
        "y[n]"
    );


    const currentOutput =
        y[n + 40];


    const currentPoint = {

        x: [n],

        y: [currentOutput],

        type: "scatter",

        mode: "markers",

        marker: {

            color: RED,

            size: 12,

            line: {
                color: "white",
                width: 2
            }
        },

        hovertemplate:
            "n = %{x}<br>" +
            "y[n] = %{y:.3f}" +
            "<extra></extra>",

        showlegend: false
    };


    await Plotly.newPlot(

        outputPlot,

        [
            ...outputTraces,
            currentPoint
        ],

        {

            title: {
                text: "Complete convolution y[n]"
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

                {
                    type: "line",

                    x0: n,
                    x1: n,

                    y0: -outputLimit,
                    y1: outputLimit,

                    line: {
                        color: RED,
                        width: 2,
                        dash: "dash"
                    }
                }
            ],

            showlegend: false,

            paper_bgcolor: "white",
            plot_bgcolor: "white"
        },

        plotConfig
    );


    plotsReady = true;
}


// ============================================================
// FAST UPDATE WHEN ONLY n CHANGES
//
// IMPORTANT:
// No Plotly.react()
// No newPlot()
// No rebuilding the figure.
//
// Only existing trace arrays are modified.
// ============================================================

function updateShift() {

    if (!plotsReady) {
        return;
    }


    calculateShift();
    updateText();


    const n = Number(slider.value);


    // ========================================================
    // TOP PLOT
    //
    // Trace indices:
    //
    // 0 = x stem lines
    // 1 = x markers
    // 2 = h stem lines
    // 3 = h markers
    //
    // Only 2 and 3 need to move!
    // ========================================================

    Plotly.restyle(

        overlapPlot,

        {
            y: [
                stemLineY(shiftedH),
                shiftedH
            ]
        },

        [2, 3]
    );


    Plotly.relayout(

        overlapPlot,

        {
            "title.text":
                `x[k] and flipped/shifted h[${n}−k]`
        }
    );


    // ========================================================
    // PRODUCT PLOT
    // ========================================================

    Plotly.restyle(

        productPlot,

        {
            y: [
                stemLineY(product),
                product
            ]
        },

        [0, 1]
    );


    Plotly.relayout(

        productPlot,

        {
            "title.text":
                `x[k]h[${n}−k] — sum = ${currentY.toFixed(3)}`
        }
    );


    // ========================================================
    // OUTPUT PLOT
    //
    // Green convolution curve DOES NOT MOVE.
    //
    // Only:
    //   red marker
    //   red vertical line
    //
    // move.
    // ========================================================

    const currentOutput =
        y[n + 40];


    Plotly.restyle(

        outputPlot,

        {
            x: [[n]],
            y: [[currentOutput]]
        },

        [2]
    );


    Plotly.relayout(

        outputPlot,

        {
            "shapes[0].x0": n,
            "shapes[0].x1": n
        }
    );
}


// ============================================================
// FULL UPDATE WHEN x[k] OR h[k] CHANGES
// ============================================================

function updateSignals() {

    if (!plotsReady) {
        return;
    }


    calculateSignals();
    calculateShift();
    updateText();


    const n = Number(slider.value);


    // --------------------------------------------------------
    // Update all four traces in top plot
    // --------------------------------------------------------

    Plotly.restyle(

        overlapPlot,

        {
            y: [
                stemLineY(x),
                x,
                stemLineY(shiftedH),
                shiftedH
            ]
        },

        [0, 1, 2, 3]
    );


    Plotly.relayout(

        overlapPlot,

        {
            "title.text":
                `x[k] and flipped/shifted h[${n}−k]`,

            "yaxis.range": [
                -signalLimit,
                signalLimit
            ]
        }
    );


    // --------------------------------------------------------
    // Product
    // --------------------------------------------------------

    Plotly.restyle(

        productPlot,

        {
            y: [
                stemLineY(product),
                product
            ]
        },

        [0, 1]
    );


    Plotly.relayout(

        productPlot,

        {
            "title.text":
                `x[k]h[${n}−k] — sum = ${currentY.toFixed(3)}`,

            "yaxis.range": [
                -signalLimit,
                signalLimit
            ]
        }
    );


    // --------------------------------------------------------
    // Entire convolution has changed
    // --------------------------------------------------------

    Plotly.restyle(

        outputPlot,

        {
            y: [
                stemLineY(y),
                y
            ]
        },

        [0, 1]
    );


    const currentOutput =
        y[n + 40];


    Plotly.restyle(

        outputPlot,

        {
            x: [[n]],
            y: [[currentOutput]]
        },

        [2]
    );


    Plotly.relayout(

        outputPlot,

        {
            "yaxis.range": [
                -outputLimit,
                outputLimit
            ],

            "shapes[0].x0": n,
            "shapes[0].x1": n,

            "shapes[0].y0": -outputLimit,
            "shapes[0].y1": outputLimit
        }
    );
}


// ============================================================
// requestAnimationFrame throttling
//
// If the slider fires 50 input events very quickly,
// render at most once per browser frame.
// ============================================================

let frameRequested = false;


function scheduleShiftUpdate() {

    if (frameRequested) {
        return;
    }


    frameRequested = true;


    requestAnimationFrame(() => {

        updateShift();

        frameRequested = false;

    });
}


// ============================================================
// Slider
// ============================================================

slider.addEventListener(
    "input",
    scheduleShiftUpdate
);


// ============================================================
// Dropdowns
// ============================================================

xMenu.addEventListener(
    "change",
    updateSignals
);


hMenu.addEventListener(
    "change",
    updateSignals
);


// ============================================================
// Minus button
// ============================================================

minusButton.addEventListener(
    "click",
    () => {

        slider.value = Math.max(

            Number(slider.min),

            Number(slider.value) - 1
        );


        scheduleShiftUpdate();
    }
);


// ============================================================
// Plus button
// ============================================================

plusButton.addEventListener(
    "click",
    () => {

        slider.value = Math.min(

            Number(slider.max),

            Number(slider.value) + 1
        );


        scheduleShiftUpdate();
    }
);


// ============================================================
// Keyboard controls
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        // Don't hijack keyboard navigation
        // while using dropdown menus.
        if (
            document.activeElement.tagName === "SELECT"
        ) {
            return;
        }


        if (event.key === "ArrowLeft") {

            event.preventDefault();


            slider.value = Math.max(

                Number(slider.min),

                Number(slider.value) - 1
            );


            scheduleShiftUpdate();
        }


        if (event.key === "ArrowRight") {

            event.preventDefault();


            slider.value = Math.min(

                Number(slider.max),

                Number(slider.value) + 1
            );


            scheduleShiftUpdate();
        }
    }
);


// ============================================================
// Start application
// ============================================================

createPlots();
