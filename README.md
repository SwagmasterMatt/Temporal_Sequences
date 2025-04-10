
# Interactive Visualization for Detecting Anomalies in Temporal Event Sequences

This project presents an interactive, browser-based visualization tool for detecting anomalies in temporal event sequences. It is designed to support audit and fraud detection tasks across various domains—such as HR data integrity, healthcare records, and financial operations—where chronological event analysis is critical.

The included visualization centers on a user-defined reference date and enables flexible reordering, interactive filtering, and pattern inspection through intuitive spline-based temporal plots.

---

## Project Overview

This visualization approach was developed in response to limitations in traditional statistical or aggregated data analysis when applied to temporally sparse or contextually complex data. The work was originally motivated by challenges in analyzing military HR records and healthcare timelines, where linear data structures fail to reveal nuanced anomalies.

To illustrate the methodology without violating data privacy, this project uses synthetic data representing a fabricated financial fraud scenario. The visualization highlights temporal anomalies—such as mismatched submission and effective dates or illogical document orderings—that would be nearly invisible to automated systems alone.

For a detailed explanation of the architecture and design rationale, refer to:  
**[Final Paper: Matthew_Ray_Final_visualization_project_760.docx](./Matthew_Ray_Final_visualization_project_760.docx)**

---

## Features

- Central temporal anchoring to align all events relative to a meaningful user-defined reference (e.g., hire date)
- Drag-and-drop interface for reordering events
- Category-based coloring and legend grouping
- Event visibility toggling and opacity control
- Spline-connected visual relationships that reveal temporal inconsistencies
- Dropdown filters for user focus (employee ID, event category)
- Zoom, pan, and reset functionality (powered by Chart.js with plugins)

---

## File Structure

```
.
├── enhanced_hr_audit_dataset.csv           # Core dataset (synthetic HR event records)
├── enhanced_hr_audit_dataset_polars.ipynb  # Jupyter notebook for generating CSV with Polars
├── index.html                              # Front-end interface (main visualization)
├── script.js                               # JavaScript logic (Chart.js + interactivity)
├── styles.css                              # CSS styles for layout and color
├── README.md                               # Project documentation
```

---

## How to Run the Project

### Option 1: Open Locally Using a Web Server

Because the visualization uses local file reads (via `PapaParse`), you must serve it via a local web server.

1. Clone or download this repository.
2. Open the project folder in your terminal.
3. Start a local server using one of the following methods:

#### Method A: Python (no dependencies)

If you have Python installed:

- For Python 3.x:
  ```bash
  python -m http.server 8000
  ```

- For Python 2.x:
  ```bash
  python -m SimpleHTTPServer 8000
  ```

4. Open your browser and go to:
   ```
   http://localhost:8000/index.html
   ```

#### Method B: VS Code Live Preview

1. Open the project folder in Visual Studio Code.
2. Install the **Live Preview** extension by Microsoft (from the Extensions Marketplace).
3. Right-click on `index.html` and select **"Show Preview"** or **"Open with Live Server"** (depending on extension version).

---

### Option 2: Modify or Generate New Data with Jupyter

If you want to generate or customize event sequences using Python:

1. Open `enhanced_hr_audit_dataset_polars.ipynb` in JupyterLab, VS Code, or another notebook interface.
2. Run the notebook to produce a new `enhanced_hr_audit_dataset.csv`.
3. Reload `index.html` in your browser as described above.

---

## Use Cases

This visualization supports detailed anomaly exploration for:

- Fraud detection (e.g., ghost employees, backdated records)
- HR audit and compliance (e.g., onboarding out of sequence)
- Electronic health record validation
- Security and access log analysis (e.g., early credential assignment)
- Policy enforcement timelines (e.g., contract approvals missing steps)

---

## Technology Stack

- [Chart.js](https://www.chartjs.org/)
- [chartjs-plugin-zoom](https://www.chartjs.org/chartjs-plugin-zoom/latest/)
- [SortableJS](https://github.com/SortableJS/Sortable)
- [PapaParse](https://www.papaparse.com/)
- [Polars](https://pola-rs.github.io/polars/) (for data generation in Python)

---

## License

This software and its visual methodology are released for **non-commercial research and academic use only**. Redistribution, commercial usage, or incorporation into commercial products is not permitted without explicit written consent from the author.

All academic or external citations referenced in the source documents and project report are intended to support the development of the visualization concept only. The user is not permitted to reuse or repackage these citations or their contents. If you wish to reference or utilize them, you must access the original sources directly through appropriate academic or publisher channels.
