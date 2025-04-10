
Chart.register(ChartZoom);

document.addEventListener("DOMContentLoaded", () => {
  let originalData = [];
  let events = [];
  let chart;
  let focusedEmployee = null;
  const ctx = document.getElementById('chart').getContext('2d');
  let pinned = false;
  let tooltipEl;
  let rawData = [];
  let colorByField = "";
  let activeCategory = null;

  const colorMap = {};
  let colorIndex = 0;

  const predefinedColors = [
    "--color-1", "--color-2", "--color-3", "--color-4", "--color-5",
    "--color-6", "--color-7", "--color-8", "--color-9", "--color-10"
  ];

  function getCategoryColor(category) {
    if (!colorMap[category]) {
      const cssVar = predefinedColors[colorIndex % predefinedColors.length];
      
      // Fallback for broken environments
      const temp = document.createElement('div');
      temp.style.display = 'none';
      temp.style.setProperty('color', `var(${cssVar})`);
      document.body.appendChild(temp);
      const computed = getComputedStyle(temp).color;
      document.body.removeChild(temp);
  
      colorMap[category] = computed || '#888';
      colorIndex++;
    }
    return colorMap[category];
  }

  // CONFIGURABLE VARIABLES
  let referenceDateField = "Employee Hire Date";
  const excludeFields = ["Employee_ID", "Story_ID", "Role", "Employee Type", "Is_Anomaly"];
  const checkboxContainerId = "checkboxes";

  Papa.parse('enhanced_hr_audit_dataset.csv', {
    header: true,
    download: true,
    dynamicTyping: true,
    complete: (results) => {
      rawData = JSON.parse(JSON.stringify(results.data)); // deep clone
      originalData = JSON.parse(JSON.stringify(rawData)); // working copy
  
      // First populate the reference date dropdown
      const allDateFields = Object.keys(originalData[0]).filter(key =>
        !excludeFields.includes(key) && !isNaN(Date.parse(originalData[0][key]))
      );
  
      const refDropdown = document.getElementById('referenceDateDropdown');
      refDropdown.innerHTML = allDateFields.map(field =>
        `<option value="${field}" ${field === referenceDateField ? 'selected' : ''}>${field}</option>`
      ).join('');
  
      refDropdown.addEventListener('change', () => {
        referenceDateField = refDropdown.value;
        recalculateDaysSince();
  
        const numericFields = new Set();

        originalData.forEach(row => {
          for (let key in row) {
            if (!excludeFields.includes(key) && typeof row[key] === "number") {
              numericFields.add(key);
            }
          }
        });

        events = [...numericFields];
        createCheckboxes(events);
        initializeSortable(events);
        renderChart(events);
      });
  
      recalculateDaysSince();

      // Build color category dropdown
      const colorDropdown = document.getElementById('colorCategoryDropdown');
      const categoricalFields = Object.keys(originalData[0]).filter(key =>
        typeof originalData[0][key] === "string" || typeof originalData[0][key] === "boolean"
      );
      colorDropdown.innerHTML = '<option value="">Color by Category</option>' +
        categoricalFields.map(key => `<option value="${key}">${key}</option>`).join('');
      colorDropdown.addEventListener('change', () => {
        colorByField = colorDropdown.value;
        renderColorLegend();
        updateChart();
      });
      
  
      const numericFields = new Set();

      originalData.forEach(row => {
        for (let key in row) {
          if (!excludeFields.includes(key) && typeof row[key] === "number") {
            numericFields.add(key);
          }
        }
      });

      events = [...numericFields];
  
      createCheckboxes(events);
      initializeSortable(events);
      createDropdown(originalData.map(d => d.Employee_ID));
      renderChart(events);
      document.getElementById('resetZoomBtn').addEventListener('click', () => chart.resetZoom());
    }
  });

  function recalculateDaysSince() {
    originalData = rawData.map(row => {
      const newRow = { ...row };
  
      // Step 1: Try to get the selected reference date
      let refDate = null;
      if (row[referenceDateField]) {
        const tryDate = new Date(row[referenceDateField]);
        if (!isNaN(tryDate)) refDate = tryDate;
      }
  
      // Step 2: Fallback to Employee Hire Date if needed
      if (!refDate && row["Employee Hire Date"]) {
        const fallback = new Date(row["Employee Hire Date"]);
        if (!isNaN(fallback)) refDate = fallback;
      }
  
      // Step 3: If no valid reference date, skip this row
      if (!refDate) return null;
  
      // Step 4: Calculate days since reference for all event fields
      for (let key in newRow) {
        if (!excludeFields.includes(key)) { // && key !== referenceDateField) 
          if (!row[key]) {
            newRow[key] = -29.9; // Default to same-day if missing
          } else {
            const eventDate = new Date(row[key]);
            newRow[key] = !isNaN(eventDate)
              ? Math.floor((eventDate - refDate) / (1000 * 60 * 60 * 24))
              : 0; // Fallback to 0 if event date invalid
          }
        }
      }
  
      return newRow;
    }).filter(row => row !== null); // remove totally invalid records
  }

  function createCheckboxes(events) {
    const container = document.getElementById('checkboxes');
    container.innerHTML = '';
    events.forEach(event => {
      const label = document.createElement('label');
      label.innerHTML = `<input type='checkbox' checked value='${event}' class='checkbox mr-2'>${event}`;
      label.className = 'checkbox-label';
      container.appendChild(label);
    });
    container.addEventListener('change', updateChart);
  }

  function initializeSortable(events) {
    const sortableContainer = document.getElementById('sortable');
    sortableContainer.innerHTML = '';
  
    events.forEach(event => {
      const li = document.createElement('li');
      li.textContent = event;
      li.className = 'sortable-pill'; // or whatever class you apply
      sortableContainer.appendChild(li);
    });
  
    new Sortable(sortableContainer, {
      animation: 150,
      onEnd: updateChart
    });
  }

  function createDropdown(employeeIds) {
    const dropdown = document.getElementById('employeeDropdown');
    dropdown.innerHTML = '<option value="">Select an Employee</option>' +
      employeeIds.map(id => `<option value="${id}">${id}</option>`).join('');
    dropdown.addEventListener('change', () => {
      focusedEmployee = dropdown.value || null;
      updateChart();
    });
  }

  function getSelectedEvents() {
    const checked = Array.from(document.querySelectorAll('#checkboxes input[type=checkbox]:checked')).map(c => c.value);
    const ordered = Array.from(document.getElementById('sortable').children).map(li => li.textContent);
    return ordered.filter(event => checked.includes(event));
  }

  function updateChart() {
    const selectedEvents = getSelectedEvents();
    renderChart(selectedEvents);
  }

  function renderColorLegend() {
    const legendContainer = document.getElementById("colorlegend");
    legendContainer.innerHTML = "";
  
    if (!colorByField) return;
  
    const uniqueValues = [...new Set(originalData.map(d => d[colorByField]))].filter(v => v !== undefined && v !== null);
  
    uniqueValues.forEach(value => {
      const color = colorMap[value] || getCategoryColor(value);
      const box = document.createElement("div");
      box.className = "legend-box";
  
      box.innerHTML = `
        <div style="width:16px;height:16px;background:${color};border-radius:3px;"></div>
        <span class="cursor-pointer">${value}</span>
      `;

      box.addEventListener("click", () => {
        activeCategory = activeCategory === value ? null : value;
        renderColorLegend(); // refresh highlight
        updateChart();
      });

      if (activeCategory === value) {
        box.style.border = "2px solid black";
        box.style.padding = "2px";
      }

      legendContainer.appendChild(box);
    });
  }

  function renderChart(selectedEvents) {
    const fallbackLineColor = "#888";
    const allowedIds = originalData
      .filter(person => {
        const matchesFocus = !focusedEmployee || person.Employee_ID === focusedEmployee;
        const matchesCategory = !activeCategory || person[colorByField] === activeCategory;
        return matchesFocus && matchesCategory;
      })
      .map(person => person.Employee_ID);
  
    const datasets = originalData.map(person => {
      const category = colorByField ? person[colorByField] : null;
      const color = category ? getCategoryColor(category) : fallbackLineColor;
      const isDimmed = !allowedIds.includes(person.Employee_ID);
      const isFocused = person.Employee_ID === focusedEmployee;
  
      return {
        label: `Employee ${person.Employee_ID}`,
        data: selectedEvents.map(event => person[event]),
        borderColor: isDimmed ? "rgba(230, 222, 222, 0.16)" : color,
        borderWidth: isFocused ? 3 : 1,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointHitRadius: 3,
        fill: false,
        tension: 0.4
      };
    });
  
    if (chart) chart.destroy();
  
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: selectedEvents,
        datasets
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        layout: {
          padding: 10
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false,
            external: customTooltip
          },
          zoom: {
            limits: {
              x: { min: 'original', max: 'original' },
              y: { min: 'original', max: 'original' }
            },
            pan: {
              enabled: true,
              mode: 'xy',
              modifierKey: 'shift',
              threshold: 10
            },
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: 'ctrl',
                speed: 0.05
              },
              drag: {
                enabled: true,
                modifierKey: 'alt'
              },
              mode: 'xy'
            }
          }
        },
        onClick: (e, elements, chartInstance) => {
          if (elements.length > 0) {
            const employeeLabel = chartInstance.data.datasets[elements[0].datasetIndex].label;
            const clickedEmployee = employeeLabel.replace("Employee ", "");
            focusedEmployee = (focusedEmployee === clickedEmployee) ? null : clickedEmployee;
            document.getElementById('employeeDropdown').value = focusedEmployee || "";
          } else {
            focusedEmployee = null;
            document.getElementById('employeeDropdown').value = "";
          }
          updateChart();
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Days Since Employee Hire',
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color')?.trim() || '#e0e0e0',
              font: { size: 14, weight: 'bold' }
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color')?.trim() || '#e0e0e0'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)' // Light grid for dark mode
            }
          },
          x: {
            title: {
              display: true,
              text: 'Events (Drag to reorder)',
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color')?.trim() || '#e0e0e0',
              font: { size: 14, weight: 'bold' }
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--chart-text-color')?.trim() || '#e0e0e0'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }
  

  const customTooltip = (context) => {
    const tooltipModel = context.tooltip;

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      tooltipEl.className = 'tooltip-container';
      document.body.appendChild(tooltipEl);
    }

    if (tooltipModel.opacity === 0 && !pinned) {
      tooltipEl.style.opacity = 0;
      return;
    }

    if (!pinned) {
      const position = context.chart.canvas.getBoundingClientRect();
      tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
      tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
      tooltipEl.innerHTML = '<div>' + tooltipModel.dataPoints.map(dp =>
        `<div>${dp.dataset.label}: ${dp.parsed.y} days</div>`).join('') +
        `<div class="tooltip-hint">(Click point to pin)</div>`;
      tooltipEl.style.opacity = 1;
    }
  };
});
