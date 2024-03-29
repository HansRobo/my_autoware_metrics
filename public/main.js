fetch('github_action_data.json')
  .then((res) => res.json())
  .then((json) => {
    const packageList = new Set(
      json.workflow_time.flatMap((data) => Object.keys(data.details ?? {})),
    );
    const mmss = (seconds) =>
      `${Math.ceil(seconds / 60)}m${(seconds % 60).toFixed(0)}s`;

    // Package duration chart
    const allPackageDurationOptions = {
      series: [],
      chart: {
        height: 500,
        type: 'donut',
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: true,
        },
        events: {
          click: (_event, _chartContext, config) => {
            const dataPoint = config.dataPointIndex;
            if (dataPoint === undefined) {
              return;
            }
          },
        },
        animations: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'All package build duration',
        align: 'left',
      },
      tooltip: {
        y: {
          formatter: mmss,
        },
      },
    };

    const allPackageDurationChart = new ApexCharts(
      document.querySelector('#all-package-time-chart'),
      allPackageDurationOptions,
    );
    allPackageDurationChart.render();

    // Handler
    const showAllPackageDuration = (buildIndex) => {
      const packageDetails = json.workflow_time[buildIndex].details ?? {};
      const packageLabels = Object.keys(packageDetails).sort(
        (a, b) => packageDetails[b] - packageDetails[a],
      );
      const packageData = packageLabels.map((label) => packageDetails[label]);

      const topPackageCount = 150;
      const topPackageLabels = packageLabels.slice(0, topPackageCount);
      const topPackageData = packageData.slice(0, topPackageCount);
      const remainingPackageSum = packageData
        .slice(30)
        .reduce((a, b) => a + b, 0);
      allPackageDurationChart.updateOptions({
        labels: [...topPackageLabels, 'Others'],
      });
      allPackageDurationChart.updateSeries([
        ...topPackageData,
        remainingPackageSum,
      ]);

      const buildSelector = document.querySelector('#build-select');
      buildSelector.value = buildIndex;
    };

    // Each package duration chart
    const multiPackageDurationOptions = {
      series: [],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: true,
        },
        events: {
          click: (_event, _chartContext, config) => {
            const dataPoint = config.dataPointIndex;
            if (dataPoint === undefined) {
              return;
            }

            showAllPackageDuration(dataPoint);
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'Build duration',
        align: 'left',
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        labels: {
          formatter: (val) => val && mmss(val),
        },
        title: {
          text: 'Duration',
        },
      },
      tooltip: {
        y: {
          formatter: (val) => val && mmss(val),
        },
      },
    };

    const multiPackageDurationChart = new ApexCharts(
      document.querySelector('#package-time-chart'),
      multiPackageDurationOptions,
    );
    multiPackageDurationChart.render();

    // Handler
    const showPackageDuration = (packageName) => {
      const packageSelector = document.querySelector('#package-select');
      packageSelector.value = packageName;

      const packageData = json.workflow_time.map((data) => [
        new Date(data.date),
        data.details?.[packageName] ?? null,
      ]);

      multiPackageDurationChart.updateSeries([
        {
          name: packageName,
          data: packageData,
        },
      ]);
    };

    // Build duration chart
    const buildDurationOptions = {
      series: [
        {
          name: 'Build duration',
          data: json.workflow_time.map((data) => {
            return [new Date(data.date), data.duration];
          }),
        },
      ],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: true,
        },
        events: {
          click: (_event, _chartContext, config) => {
            const dataPoint = config.dataPointIndex;
            if (dataPoint === undefined) {
              return;
            }

            showAllPackageDuration(dataPoint);
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'Build duration',
        align: 'left',
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        labels: {
          formatter: (val) => `${val.toFixed(2)}h`,
        },
        title: {
          text: 'Duration',
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return `${val.toFixed(2)}h`;
          },
        },
      },
    };

    const buildDurationChart = new ApexCharts(
      document.querySelector('#build-time-chart'),
      buildDurationOptions,
    );
    buildDurationChart.render();

    // Build selector
    const buildSelector = document.querySelector('#build-select');
    json.workflow_time.forEach((data, index) => {
      if (data.details !== null) {
        const option = document.createElement('option');
        option.value = index;
        option.text = `${data.date} (${data.duration.toFixed(2)}h)`;
        buildSelector.appendChild(option);
      }
    });

    buildSelector.addEventListener('change', (event) => {
      showAllPackageDuration(Number(event.target.value));
    });

    // Package selector
    const packageSelector = document.querySelector('#package-select');

    Array.from(packageList)
      .sort()
      .forEach((key) => {
        const option = document.createElement('option');
        option.value = key;
        option.text = `${key}`;
        packageSelector.appendChild(option);
      });

    packageSelector.addEventListener('change', (event) => {
      showPackageDuration(event.target.value);
    });

    // cSpell
    const spellOptions = {
      series: [
        {
          name: 'Spell check errors',
          data: json.spell_checks.map((data) => {
            return [new Date(data.date), data.count];
          }),
        },
      ],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false,
        },
        selection: {
          enabled: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'Spell check errors',
        align: 'left',
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        type: 'datetime',
      },
    };

    const spellChart = new ApexCharts(
      document.querySelector('#spell-chart'),
      spellOptions,
    );
    spellChart.render();

    // PR charts
    const pullOptions = {
      series: [
        {
          name: 'Duration (days)',
          data: Object.keys(json.pulls.closed_per_month).map((month) => {
            return [
              month,
              json.pulls.closed_per_month[month].map(
                (durations) => durations / (60 * 60 * 24),
              ),
            ];
          }),
        },
      ],
      chart: {
        height: 350,
        type: 'boxPlot',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'How long it takes to close a PR',
        align: 'left',
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        type: 'datetime',
      },
    };

    const pullChart = new ApexCharts(
      document.querySelector('#pr-chart'),
      pullOptions,
    );
    pullChart.render();

    // Docker
    const dockerOptions = {
      series: [
        {
          name: 'Image Size',
          data: json.docker_images.map((data) => {
            return [new Date(data.date), data.size / 1024 / 1024 / 1024];
          }),
        },
      ],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      title: {
        text: 'Docker Image Size',
        align: 'left',
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        labels: {
          formatter: (val) => `${val.toFixed(2)}GB`,
        },
        title: {
          text: 'Size',
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return `${val.toFixed(2)}GB`;
          },
        },
      },
    };

    const dockerChart = new ApexCharts(
      document.querySelector('#docker-chart'),
      dockerOptions,
    );
    dockerChart.render();
  });
