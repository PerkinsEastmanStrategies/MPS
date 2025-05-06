// Script.js

document.addEventListener("DOMContentLoaded", function () {
    const regionSelect = document.getElementById("regionSelect");
    const enrollmentCtx = document.getElementById("enrollmentHistogram").getContext("2d");
    const historicCtx = document.getElementById("historicChangeChart").getContext("2d");
    const enrollmentTrendCtx = document.getElementById("enrollmentTrendChart").getContext("2d");
    
    const gradeTypeCell = document.getElementById("gradeType");
    const enrollmentCell = document.getElementById("enrollment");
    const attendanceZoneCell = document.getElementById("attendanceZone");

    const schoolSelect = document.getElementById("schoolSelect");
    let schoolEnrollmentChart;
    const enrollmentChartCtx = document.getElementById("schoolEnrollmentChart").getContext("2d");
    
    const levelColors = {
        "Elementary School": "#FF530D",
        "Middle School": "#0033A0",
        "High School": "#00857D",
        "K-8": "#FFC72C",
        "Unknown": "#7F2268"
    };
    

    
    let allData = [];
    let facilitiesData = [];
let buildingAgeChart;
let enrollmentVsSqftChart;
let fciPieChart;


Papa.parse("MPS_Facilities.csv", {
    download: true,
    header: true,
    complete: function (results) {
        facilitiesData = results.data;
        updateBuildingAgeChart("All Regions"); // initialize
        updateEnrollmentVsSqftChart("All Regions");
        updateUtilizationDonutChart(facilitiesData)
        updateFciPieChart(facilitiesData);

    }
});
let utilizationDonutChart;

function updateUtilizationDonutChart(data) {
    const categories = ["High", "Good", "Low", "Very Low"];
    const categoryCounts = { High: 0, Good: 0, Low: 0, "Very Low": 0 };

    data.forEach(d => {
        const cat = d["Utilization Categories"]?.trim();
        if (categories.includes(cat)) {
            categoryCounts[cat]++;
        }
    });

    const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const percentages = categories.map(cat => total ? (categoryCounts[cat] / total) * 100 : 0);

    if (utilizationDonutChart) utilizationDonutChart.destroy();

    const ctx = document.getElementById("utilizationDonutChart").getContext("2d");
    utilizationDonutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: categories,
            datasets: [{
                data: percentages,
                backgroundColor: ["#2ca02c", "#1f77b4", "#ff7f0e", "#d62728"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "% of Schools by Utilization Category",
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)}%`
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateFciPieChart(data) {
    const categories = ["Great", "Good", "Fair", "Poor"];
    const counts = { Great: 0, Good: 0, Fair: 0, Poor: 0 };

    data.forEach(d => {
        const rating = d["FCI Rating"]?.trim();
        if (categories.includes(rating)) {
            counts[rating]++;
        }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentages = categories.map(cat => total ? (counts[cat] / total) * 100 : 0);

    if (fciPieChart) fciPieChart.destroy();

    const ctx = document.getElementById("fciPieChart").getContext("2d");
    fciPieChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{
                data: percentages,
                backgroundColor: ["#2ca02c", "#ff7f0e", "#d62728", "#9467bd"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "% of Schools by FCI Rating",
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.raw.toFixed(1)}%`
                    }
                },
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

    // Load CSV Data
    Papa.parse("MPS Data.csv", {
        download: true,
        header: true,
        complete: function (results) {
            allData = results.data;
            console.log("CSV Data Loaded:", allData); // Check if data is loading
    
            populateRegions(allData);
            
            console.log("Updating Histogram Chart...");
            updateHistogram(allData);
    
            console.log("Updating Historic Change Chart...");
            updateBarChart(allData);
    
            console.log("Updating Enrollment Trends Chart...");
            console.log("Data for Enrollment Trends:", allData); // Debug data
            updateEnrollmentTrends(allData);

            console.log("Updating Total Enrollment Chart...");
            updateTotalEnrollmentChart(allData);

            console.log("Checking Data Load: ", allData.length, "entries loaded.");
                   
            // ✅ Ensure All Charts Load Only After Data is Ready
        console.log("All Data Loaded. Now Updating All Regions Charts...");
        updateCharts("All Regions");
    
        }
    });



    // Populate dropdown with unique regions
    function populateRegions(data) {
        const regions = [...new Set(data.map(d => d["Geographic Region"] ? d["Geographic Region"].trim() : "Unknown"))];
        regions.forEach(region => {
            if (region) {  // Ensure region is not empty or undefined
                let option = document.createElement("option");
                option.value = region;
                option.textContent = region;
                regionSelect.appendChild(option);
            }
        });
        console.log("Regions added:", regions); // Debugging line
    }
    
    function populateSchools(region) {
        schoolSelect.innerHTML = '<option value="All Schools">All Schools</option>'; // Reset schools dropdown
    
        let filteredData = region === "All Regions" 
            ? allData 
            : allData.filter(d => d["Geographic Region"]?.trim() === region);
    
        let schools = [...new Set(filteredData.map(d => d["Site list"]?.trim() || ""))].sort();
    
        schools.forEach(school => {
            if (school) {
                let option = document.createElement("option");
                option.value = school;
                option.textContent = school;
                schoolSelect.appendChild(option);
            }
        });
    
        console.log("Schools added:", schools); // Debugging line
    }
    
    // ✅ MOVE THIS FUNCTION OUTSIDE populateSchools()
    function updateSchoolDetails(schoolName) {
        if (schoolName === "All Schools") {
            document.getElementById("gradeType").textContent = "-";
            document.getElementById("enrollment").textContent = "-";
            document.getElementById("attendanceZone").textContent = "-";
            return;
        }
    
        let schoolData = allData.find(d => d["Site list"]?.trim() === schoolName);
        
        if (schoolData) {
            // Clear previous content to prevent duplication
            document.getElementById("schoolDetails").innerHTML = `
                <tr><th>Grade Type</th></tr>
                <tr><td>${schoolData["Grouped School Levels"]?.trim() || "N/A"}</td></tr>
                <tr><th>Enrollment (2023-2024)</th></tr>
                <tr><td>${schoolData["2023-2024"] || "N/A"}</td></tr>
                <tr><th>% from Attendance Zone</th></tr>
                <tr><td>${schoolData["Percent Students Attending from attendance Area"] || "N/A"}</td></tr>
            `;

    
            // Extract Enrollment Data for Chart
            const years = ["2014-2015", "2015-2016", "2016-2017", "2017-2018", "2018-2019", 
                           "2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024"];
    
            const enrollments = years.map(year => parseInt(schoolData[year]) || 0);
    
            // Update or Create Chart
            if (schoolEnrollmentChart) {
                schoolEnrollmentChart.destroy(); // Clear previous chart
            }
    
            schoolEnrollmentChart = new Chart(enrollmentChartCtx, {
                type: "bar",
                data: {
                    labels: years,
                    datasets: [{
                        label: "Enrollment",
                        data: enrollments,
                        backgroundColor: "#0033A0",
                        borderColor: "black",
                        borderWidth: 1,
                        barPercentage: 0.5,  // Adjusts individual bar thickness (0.0 - 1.0)
                        categoryPercentage: 0.7  // Adjusts overall space bars take up (0.0 - 1.0)
                    }]
                    
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    devicePixelRatio: 2, // Improves clarity
                    plugins: {
                        title: { display: false }, // Remove chart title
                        legend: { display: false }, // Hide legend
                        tooltip: { // Show details on hover
                            enabled: true,
                            callbacks: {
                                label: (tooltipItem) => `Enrollment: ${tooltipItem.raw}`
                            }
                        }
                    },
                    scales: {
                        x: { 
                            display: false // Hide X-axis completely
                        },
                        y: { 
                            display: true, // Show only Y-axis
                            title: { display: false }, // No Y-axis title
                            ticks: { font: { size: 15 } } // Smaller Y-axis labels for a clean look
                        }
                    }
                }
                
            });
        } else {
            gradeTypeCell.textContent = "N/A";
            enrollmentCell.textContent = "N/A";
            attendanceZoneCell.textContent = "N/A";
    
            if (schoolEnrollmentChart) {
                schoolEnrollmentChart.destroy(); // Clear chart if no data
            }
        }
    }
    
    
    // ✅ Ensure school dropdown triggers update when selection changes
    schoolSelect.addEventListener("change", function () {
        updateSchoolDetails(schoolSelect.value);
    });
    
    // Filter and update charts
    regionSelect.addEventListener("change", function () {
        let selectedRegion = regionSelect.value === "All" ? "All Regions" : regionSelect.value;
        populateSchools(selectedRegion);
        updateCharts(selectedRegion);
        updateBuildingAgeChart(selectedRegion);
        updateEnrollmentVsSqftChart(selectedRegion);
    
        // ✅ Add these two lines:
        const filteredFacilities = selectedRegion === "All Regions"
            ? facilitiesData
            : facilitiesData.filter(d => d["Geographic Region"]?.trim() === selectedRegion);
        
        updateUtilizationDonutChart(filteredFacilities); // already working
        updateFciPieChart(filteredFacilities); // ✅ this line makes the FCI chart update!
    });
    
    

    schoolSelect.addEventListener("change", function () {
        updateSchoolDetails(schoolSelect.value);
    });
    
    function updateBuildingAgeChart(region) {
        if (!facilitiesData || facilitiesData.length === 0) return;
    
        const bins = ["1880","1890","1900","1910","1920", "1920", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];

        const totalCounts = {};
        const regionCounts = {};
    
        bins.forEach(bin => {
            totalCounts[bin] = 0;
            regionCounts[bin] = 0;
        });
    
        facilitiesData.forEach(d => {
            const decade = d["decade"];
            const regionMatch = d["Geographic Region"]?.trim() === region;
    
            if (bins.includes(decade)) {
                totalCounts[decade]++;
                if (region === "All Regions" || regionMatch) {
                    regionCounts[decade]++;
                }
            }
        });
    
        const total = Object.values(totalCounts).reduce((a, b) => a + b, 0);
        const regionTotal = Object.values(regionCounts).reduce((a, b) => a + b, 0);
    
        const districtPercents = bins.map(b => total ? (totalCounts[b] / total) * 100 : 0);
        const regionPercents = bins.map(b => regionTotal ? (regionCounts[b] / regionTotal) * 100 : 0);
    
        if (buildingAgeChart) buildingAgeChart.destroy();
    
        const ctx = document.getElementById("buildingAgeChart").getContext("2d");
        buildingAgeChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: bins,
                datasets: [
                    {
                        label: "Selected Region",
                        data: regionPercents,
                        backgroundColor: "#FF530D"
                    },
                    {
                        label: "District",
                        data: districtPercents,
                        backgroundColor: "#A9A9A9"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Building Age by Decade (% of Facilities)",
                        font: { size: 18 }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Decade" }
                    },
                    y: {
                        title: { display: true, text: "% of Buildings" },
                        ticks: { callback: val => `${val}%` },
                        max: 50
                    }
                }
            }
        });
    }
    

    function updateCharts(region) {
        console.log("Updating charts for region:", region);
        
        let filteredData = (region === "All Regions" || !region) ? allData : allData.filter(d => d["Geographic Region"]?.trim() === region);
        
        if (!filteredData || filteredData.length === 0) {
            console.warn("⚠️ No filtered data found, defaulting to allData.");
            filteredData = allData;
        }
    
        console.log("Filtered Data Count:", filteredData.length);
    
        // 🔹 Ensure filteredData isn't undefined
        if (!filteredData || filteredData.length === 0) {
            console.error("🚨 Critical Error: filteredData is empty even after fallback.");
            return;
        }
    
        updateHistogram(filteredData);
        updateBarChart(filteredData);
        updateEnrollmentTrends(filteredData);
        updateTotalEnrollmentChart(filteredData);
        const facilitiesFiltered = region === "All Regions"
        ? facilitiesData
        : facilitiesData.filter(d => d["Geographic Region"]?.trim() === region);
    
    updateUtilizationDonutChart(facilitiesFiltered);
    updateFciPieChart(facilitiesFiltered);  // ✅ Use the right variable name
    

    }
    
    
    
    function updateEnrollmentTrends(data) {
        console.log("Updating Enrollment Trends. Total Records:", data.length);
    
        if (window.enrollmentTrendChart instanceof Chart) {
            window.enrollmentTrendChart.destroy();
        }
    
        const years = ["2014-2015", "2015-2016", "2016-2017", "2017-2018", "2018-2019", 
                       "2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024"];
    
        let trendData = {};
    
        data.forEach(d => {
            const level = d["Grouped School Levels"] ? d["Grouped School Levels"].trim() : "Unknown";
            if (!trendData[level]) {
                trendData[level] = new Array(years.length).fill(0);
            }
    
            years.forEach((year, index) => {
                const value = parseInt(d[year], 10);
                if (!isNaN(value)) {
                    trendData[level][index] += value;
                } else {
                    console.log(`Missing value for ${level} in ${year}:`, d[year]);
                }
            });
        });
    
        console.log("Trend Data:", trendData);
    
        const datasets = Object.keys(trendData).map(level => ({
            label: level,
            data: trendData[level],
            borderColor: levelColors[level] || levelColors["Unknown"],
            fill: false,
            pointRadius: 5
        }));
    
        window.enrollmentTrendChart = new Chart(enrollmentTrendCtx, {
            type: "line",
            data: {
                labels: years,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Enrollment Trends by School Level (2014-2024)",
                        font: { size: 20 }
                    }
                },
                scales: {
                    x: { title: { display: true, text: "School Year", font: { size: 16 } } },
                    y: { title: { display: true, text: "Total Enrollment", font: { size: 16 } } }
                }
            }
        });
    }
    
    
    function updateTotalEnrollmentChart(data) {
        console.log("Updating Total Enrollment Chart...");
    
        if (window.totalEnrollmentChart instanceof Chart) {
            window.totalEnrollmentChart.destroy();
        }
    
        const historicYears = [
            "2014-2015", "2015-2016", "2016-2017", "2017-2018", "2018-2019", 
            "2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024"
        ];
    
        let totalEnrollment = new Array(historicYears.length).fill(0);
    
        data.forEach(d => {
            historicYears.forEach((year, index) => {
                const value = parseInt(d[year], 10);
                if (!isNaN(value)) {
                    totalEnrollment[index] += value;
                }
            });
        });
    
        const ctx = document.getElementById("totalEnrollmentChart").getContext("2d");
    
        window.totalEnrollmentChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: historicYears,  // Only historic years
                datasets: [
                    {
                        label: "Total Enrollment",
                        data: totalEnrollment,
                        backgroundColor: "#0033A0",  // Single color for all bars
                        borderColor: "black",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Total Enrollment by Year",
                        font: { size: 20 }
                    },
                    legend: { display: false }
                },
                scales: {
                    x: { 
                        title: { display: true, text: "School Year", font: { size: 16 } },
                        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
                    },
                    y: { 
                        title: { display: true, text: "Total Enrollment", font: { size: 16 } }
                    }
                }
            }
        });
    }
    
    function updateEnrollmentVsSqftChart(region) {
        if (!facilitiesData || facilitiesData.length === 0) return;
    
        const filtered = facilitiesData.filter(d => 
            region === "All Regions" || d["Geographic Region"]?.trim() === region
        );
    
        const points = filtered.map(d => {
            const enrollment = parseInt(d["2023-2024"], 10);
            const sqft = parseInt(d["Square Feet"]?.replace(/,/g, ""), 10);
            if (!isNaN(enrollment) && !isNaN(sqft)) {
                return { x: enrollment, y: sqft, label: d["Site"] || "Unknown" };
            }
            return null;
        }).filter(Boolean);
    
        if (enrollmentVsSqftChart) enrollmentVsSqftChart.destroy();
    
        const ctx = document.getElementById("enrollmentVsSqftChart").getContext("2d");
        enrollmentVsSqftChart = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: [{
                    label: "School Buildings",
                    data: points,
                    backgroundColor: "#00857D",
                    borderColor: "black",
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.raw.label}: ${ctx.raw.x} students, ${ctx.raw.y.toLocaleString()} sqft`
                        }
                    },
                    title: {
                        display: true,
                        text: "Enrollment vs. Square Feet (2023-2024)",
                        font: { size: 18 }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Enrollment (2023-2024)" },
                        beginAtZero: true
                    },
                    y: {
                        title: { display: true, text: "Square Feet" },
                        beginAtZero: true
                    }
                }
            }
        });
    }
    

    function updateHistogram(data) {
        const bins = [0, 200, 400, 600, 800, 1000, 3000];
        let groupedCounts = {};
        const levels = [...new Set(data.map(d => d["Grouped School Levels"]?.trim()))];
    
        levels.forEach(level => groupedCounts[level] = new Array(bins.length - 1).fill(0));
    
        data.forEach(d => {
            const enrollment = parseInt(d["2023-2024"], 10) || 0;
            const level = d["Grouped School Levels"]?.trim();
            for (let i = 0; i < bins.length - 1; i++) {
                if (enrollment >= bins[i] && enrollment < bins[i + 1]) {
                    groupedCounts[level][i]++;
                    break;
                }
            }
        });
    
        if (window.histogramChart) window.histogramChart.destroy();
        window.histogramChart = new Chart(enrollmentCtx, {
            type: "bar",
            data: {
                labels: bins.slice(0, -1).map((b, i) => `${b}-${bins[i+1]}`),
                datasets: levels.map(level => ({
                    label: level,
                    data: groupedCounts[level],
                    stack: "stack1", // Enable stacking
                    backgroundColor: levelColors[level] || "gray", // Use fixed colors
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        stacked: true, 
                        title: { display: true, text: "Enrollment Ranges", font: { size: 16 } },
                        ticks: { font: { size: 16 } }
                    },
                    y: { 
                        stacked: true, 
                        title: { display: true, text: "Number of Schools", font: { size: 16 } },
                        ticks: { font: { size: 16 } }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: "Enrollment Distribution by School Level",
                        font: { size: 20 }
                    }
                }
            }
            
        });
    }
    
    console.log("Debugging issue at line 424: Checking allData", allData);
    console.log("Checking filteredData", filteredData);

    function updateBarChart(data) {
        const schoolNames = data.map(d => (d["Site list"] ? d["Site list"].trim() : "Unknown"));
        const changes = data.map(d => parseInt(d["5-year Historic Change"], 10) || 0);

        if (window.barChart) window.barChart.destroy();
        window.barChart = new Chart(historicCtx, {
            type: "bar",
            data: {
                labels: schoolNames,
                datasets: [{
                    data: changes,
                    backgroundColor: changes.map(val => val < 0 ? "#FF530D" : "#0033A0")
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        stacked: true, 
                        title: { display: true, text: "Change in Enrollment", font: { size: 16 } },
                        ticks: { font: { size: 14 } }
                    },
                    y: { 
                        stacked: true, 
                        title: { display: true, text: "Schools", font: { size: 16 } },
                        ticks: { font: { size: 14 } }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: "5-Year Historic Enrollment Changes",
                        font: { size: 20 }
                    }
                }
            }
            
        });
    }

    function getRandomColor() {
        return `hsl(${Math.random() * 360}, 70%, 50%)`;
    }
});
const viewToggle = document.getElementById("viewToggle");
const enrollmentCharts = document.getElementById("enrollmentCharts");
const facilitiesCharts = document.getElementById("facilitiesCharts");

viewToggle.addEventListener("change", function () {
    const selectedView = this.value;

    if (selectedView === "enrollment") {
        enrollmentCharts.style.display = "grid";
        facilitiesCharts.style.display = "none";
    } else if (selectedView === "facilities") {
        enrollmentCharts.style.display = "none";
        facilitiesCharts.style.display = "grid";
    }
});
