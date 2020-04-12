google.charts.load('current', {packages: ['corechart', 'line']});

function parse(response) {
  var data = response.split("\n");

  var result = {};
  var byCountries = {};

  for (var i = 1; i < data.length; ++i) {
    var row = data[i].split(",");

    var country = row[1];

    if (!result[country]) {
      result[country] = {};
    }

    var date = row[0].split('-');
    var year = +date[0];
    var month = +date[1];
    var day = +date[2];

    result[country][year] = result[country][year] || {};
    result[country][year][month] = result[country][year][month] || {};

    byCountries[country] = byCountries[country] || {
      deaths: 0,
      recovered: 0,
      confirmed: 0
    };

    byCountries[country].confirmed += +row[2];
    byCountries[country].recovered += +row[3];
    byCountries[country].deaths    += +row[4];

    result[country][year][month][day] = {
      confirmed: byCountries[country].confirmed,
      deaths: byCountries[country].deaths,
      recovered: byCountries[country].recovered
    };
  }

  return result;
}

function convertToData(parsed, callback) {
  var result = new google.visualization.DataTable();

  result.addColumn("date", "X");

  var rows  = [];
  var dates = [];

  for (var country in parsed) {
    result.addColumn("number", country);

    for (var year in parsed[country]) {
      for (var month in parsed[country][year]) {
        for (var day in parsed[country][year][month]) {
          dates[+year] = dates[+year] || {};
          dates[+year][+month] = dates[+year][+month] || {};
          dates[+year][+month][+day] = new Date(+year, +month - 1, +day, 0, 0, 0);
        }
      }
    }
  }

  for (var year in dates) {
    for (var month in dates[year]) {
      for (var day in dates[year][month]) {
        var row = [dates[year][month][day]];

        for (var country in parsed) {
          if (parsed[country][year] && parsed[country][year][month] && parsed[country][year][month][day]) {
            row.push(+callback(country, parsed[country][year][month][day]));
          } else {
            row.push(0);
          }
        }

        rows.push(row);
      }
    }
  }

  result.addRows(rows);

  return result;
}

function redraw(data, name, el) {
  var options = {
    hAxis: {
      title: "Date"
    },
    vAxis: {
      title: name
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById(el));
//  var chart = new google.charts.Line(document.getElementById(el));
//  chart.draw(data, google.charts.Line.convertOptions(options)); 
  chart.draw(data, options)
}

function test() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://raw.githubusercontent.com/datasets/covid-19/master/data/countries-aggregated.csv");
  xhr.send();
  xhr.onload = function() {
    var parsed = parse(xhr.response);

    var deathRate = convertToData(parsed, function(country, item) {
      if (item.deaths + item.recovered === 0) {
        return 0;
      }

      return item.deaths / (item.deaths + item.recovered) * 100;
    });

    redraw(deathRate, "Death Rate (%)", "death-rate");
  }
}

var t = setTimeout(test, 1000);
